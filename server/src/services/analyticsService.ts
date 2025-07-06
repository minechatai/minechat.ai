// server/src/services/analyticsService.ts

// Helper function to analyze messages for business questions using AI
export async function groupQuestionsByIntent(questions: string[]): Promise<any[]> {
  if (questions.length === 0) return [];

  // Simple semantic grouping for common patterns
  const groups: { [key: string]: { question: string; count: number; variants: string[] } } = {};

  questions.forEach(question => {
    const normalized = question.trim();
    let groupKey = findSemanticGroup(normalized);

    if (!groups[groupKey]) {
      groups[groupKey] = {
        question: groupKey,
        count: 0,
        variants: []
      };
    }

    groups[groupKey].count++;
    groups[groupKey].variants.push(normalized);
  });

  return Object.values(groups);
}

export function findSemanticGroup(question: string): string {
  const lower = question.toLowerCase();

  // Products and services grouping
  if ((lower.includes('product') || lower.includes('service')) && 
      (lower.includes('what') || lower.includes('tell me') || lower.includes('about'))) {
    return "What are your products and services?";
  }

  // Specific product functionality
  if (lower.includes('product') && (lower.includes('do') || lower.includes('does'))) {
    return "What does your product do?";
  }

  // Discount grouping
  if (lower.includes('discount') || lower.includes('sale') || lower.includes('offer')) {
    return "Do you have any discounts or special offers?";
  }

  // Hours/availability grouping
  if (lower.includes('hour') || lower.includes('open') || lower.includes('close') || lower.includes('time')) {
    return "What are your business hours?";
  }

  // Pricing grouping
  if (lower.includes('price') || lower.includes('cost') || lower.includes('much')) {
    return "What are your prices?";
  }

  // Contact grouping
  if (lower.includes('contact') || lower.includes('reach') || lower.includes('phone') || lower.includes('email')) {
    return "How can I contact you?";
  }

  // Location grouping
  if (lower.includes('location') || lower.includes('address') || lower.includes('where')) {
    return "Where are you located?";
  }

  // Default: return the original question
  return question;
}

export async function analyzeMessagesForQuestions(messages: any[], userId: string): Promise<string[]> {
  const businessQuestions: string[] = [];

  // Create a prompt to extract business-related questions
  const questionDetectionPrompt = `
    Analyze the following customer messages and extract only business-related questions. 
    Focus on questions about: products/services, pricing, office hours, location/address, contact info, policies, features, availability, ordering, support, etc.

    EXCLUDE: personal chit-chat, off-topic questions, and non-business inquiries.

    Return only the business questions, one per line. Rephrase them in a clear, professional way if needed.
    If a statement implies a question (like "Tell me about your services"), convert it to a question format.

    Messages to analyze:
    ${messages.map(m => `- ${m.content}`).join('\n')}
  `;

  try {
    // Try OpenAI API for question detection
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: questionDetectionPrompt }],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (response.ok) {
      const aiResponse = await response.json();
      const extractedQuestions = aiResponse.choices[0]?.message?.content || "";

      // Parse the response and filter out empty lines
      const questions = extractedQuestions
        .split('\n')
        .map((q: string) => q.replace(/^[-*]\s*/, '').trim())
        .filter((q: string) => q.length > 10); // Filter out very short responses

      businessQuestions.push(...questions);
    } else {
      // Fallback: use basic keyword detection
      const fallbackQuestions = await fallbackKeywordDetection(messages);
      businessQuestions.push(...fallbackQuestions);
    }
  } catch (error) {
    console.error("Error in AI question analysis:", error);

    // Fallback to keyword-based detection
    const fallbackQuestions = await fallbackKeywordDetection(messages);
    businessQuestions.push(...fallbackQuestions);
  }

  return businessQuestions;
}

// Helper function for fallback keyword detection
async function fallbackKeywordDetection(messages: any[]): Promise<string[]> {
  const businessQuestions: string[] = [];
  const businessKeywords = [
    'price', 'cost', 'how much', 'pricing',
    'hours', 'open', 'closed', 'available',
    'where', 'location', 'address',
    'contact', 'phone', 'email',
    'services', 'products', 'offer',
    'policy', 'return', 'refund',
    'support', 'help', 'order'
  ];

  messages.forEach(message => {
    const content = message.content.toLowerCase();
    const hasBusinessKeyword = businessKeywords.some(keyword => content.includes(keyword));
    const isQuestion = content.includes('?') || content.startsWith('what') || content.startsWith('how');

    if (hasBusinessKeyword && isQuestion) {
      businessQuestions.push(message.content);
    }
  });

  return businessQuestions;
}

// Helper function to group similar questions
export function groupSimilarQuestions(questions: string[]): { question: string; count: number; variants: string[] }[] {
  const groups: { question: string; count: number; variants: string[] }[] = [];

  questions.forEach(question => {
    const cleanQuestion = question.toLowerCase().replace(/[?!.]/g, '');

    // Find if this question is similar to an existing group
    let matchedGroup = groups.find(group => {
      const cleanGroupQuestion = group.question.toLowerCase().replace(/[?!.]/g, '');

      // Check for keyword similarity
      const questionWords = cleanQuestion.split(' ').filter(w => w.length > 3);
      const groupWords = cleanGroupQuestion.split(' ').filter(w => w.length > 3);

      const commonWords = questionWords.filter(word => 
        groupWords.some(groupWord => 
          groupWord.includes(word) || word.includes(groupWord)
        )
      );

      // Consider similar if they share significant keywords
      return commonWords.length >= Math.min(2, Math.floor(questionWords.length / 2));
    });

    if (matchedGroup) {
      matchedGroup.count++;
      matchedGroup.variants.push(question);

      // Use the most common phrasing (shortest, most professional)
      if (question.length < matchedGroup.question.length && 
          (question.includes('?') || !matchedGroup.question.includes('?'))) {
        matchedGroup.question = question;
      }
    } else {
      groups.push({
        question: question,
        count: 1,
        variants: [question]
      });
    }
  });

  return groups;
}