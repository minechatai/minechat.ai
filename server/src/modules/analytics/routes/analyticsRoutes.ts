// server/src/modules/analytics/routes/analyticsRoutes.ts

import { Express } from "express";

export function setupAnalyticsRoutes(app: Express) {
  const { isAuthenticated } = require("../../../middleware/auth");
  const storage = require("../../../storage");

  // Helper function for grouping questions by semantic intent
  async function groupQuestionsByIntent(questions: string[]) {
    // Simple grouping by keywords for now - can be enhanced with AI later
    const groups: { [key: string]: { question: string; count: number; examples: string[] } } = {};

    questions.forEach(question => {
      const lowerQuestion = question.toLowerCase();
      let category = "general";

      // Categorize questions by common patterns
      if (lowerQuestion.includes("price") || lowerQuestion.includes("cost") || lowerQuestion.includes("how much")) {
        category = "pricing";
      } else if (lowerQuestion.includes("product") || lowerQuestion.includes("service") || lowerQuestion.includes("sell")) {
        category = "products";
      } else if (lowerQuestion.includes("contact") || lowerQuestion.includes("phone") || lowerQuestion.includes("email")) {
        category = "contact";
      } else if (lowerQuestion.includes("hours") || lowerQuestion.includes("open") || lowerQuestion.includes("available")) {
        category = "availability";
      } else if (lowerQuestion.includes("payment") || lowerQuestion.includes("pay") || lowerQuestion.includes("card")) {
        category = "payment";
      }

      if (!groups[category]) {
        groups[category] = {
          question: question,
          count: 0,
          examples: []
        };
      }

      groups[category].count++;
      if (groups[category].examples.length < 3) {
        groups[category].examples.push(question);
      }
    });

    return Object.values(groups);
  }

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analytics = await storage.getAnalytics(userId);

      // If no analytics exist, return default values
      if (!analytics) {
        const defaultAnalytics = {
          unreadMessages: 0,
          moneySaved: "0",
          leads: 0,
          opportunities: 0,
          followUps: 0,
          messagesHuman: 0,
          messagesAi: 0,
          hourlyData: null,
        };
        return res.json(defaultAnalytics);
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Time Saved Analytics endpoint
  app.get('/api/analytics/time-saved', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, comparisonPeriod } = req.query;

      console.log("🔍 Time Saved Debug - User ID:", userId);
      console.log("🔍 Time Saved Debug - Date Range:", { startDate, endDate });
      console.log("🔍 Time Saved Debug - Comparison Period:", comparisonPeriod);

      // Get AI messages from legitimate customer conversations only
      const aiMessages = await storage.getCustomerAiMessages(userId, startDate, endDate);
      console.log("🔍 Time Saved Debug - AI Messages found:", aiMessages.length);

      // Calculate time saved (3 minutes per AI response)
      const minutesPerResponse = 3;
      const totalMinutes = aiMessages.length * minutesPerResponse;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      let timeSaved;
      if (hours === 0) {
        timeSaved = `${minutes} mins`;
      } else if (minutes === 0) {
        timeSaved = `${hours} hours`;
      } else {
        timeSaved = `${hours} hours ${minutes} mins`;
      }

      // Calculate comparison period if provided
      let change = "same as last month";
      if (comparisonPeriod && startDate && endDate) {
        // Calculate previous period dates
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 1000)) + 1;

        let prevStartDate, prevEndDate;
        if (comparisonPeriod === 'week') {
          prevStartDate = new Date(startDateObj.getTime() - (7 * 24 * 60 * 60 * 1000));
          prevEndDate = new Date(endDateObj.getTime() - (7 * 24 * 60 * 60 * 1000));
        } else { // month
          prevStartDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() - 1, startDateObj.getDate());
          prevEndDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 1, endDateObj.getDate());
        }

        const prevPeriodMessages = await storage.getCustomerAiMessages(
          userId, 
          prevStartDate.toISOString().split('T')[0], 
          prevEndDate.toISOString().split('T')[0]
        );

        const prevTotalMinutes = prevPeriodMessages.length * minutesPerResponse;

        if (prevTotalMinutes > 0) {
          const percentChange = Math.round(((totalMinutes - prevTotalMinutes) / prevTotalMinutes) * 100);
          if (percentChange > 0) {
            change = `+${percentChange}% vs last ${comparisonPeriod}`;
          } else if (percentChange < 0) {
            change = `${percentChange}% vs last ${comparisonPeriod}`;
          } else {
            change = `same as last ${comparisonPeriod}`;
          }
        }
      }

      res.json({
        timeSaved,
        change,
        totalMessages: aiMessages.length,
        totalMinutes
      });

    } catch (error) {
      console.error("Error calculating time saved:", error);
      res.status(500).json({ message: "Failed to calculate time saved" });
    }
  });

  // Messages Sent Analytics endpoint
  app.get('/api/analytics/messages-sent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, comparisonPeriod } = req.query;

      console.log("🔍 Messages Sent Debug - User ID:", userId);
      console.log("🔍 Messages Sent Debug - Date Range:", { startDate, endDate });
      console.log("🔍 Messages Sent Debug - Comparison Period:", comparisonPeriod);

      // Get outbound messages (AI and human) from legitimate customer conversations only
      const outboundMessages = await storage.getOutboundMessages(userId, startDate, endDate);

      const aiCount = outboundMessages.ai.length;
      const humanCount = outboundMessages.human.length;
      const totalMessages = aiCount + humanCount;

      console.log("🔍 Messages Sent Debug - AI Messages:", aiCount);
      console.log("🔍 Messages Sent Debug - Human Messages:", humanCount);
      console.log("🔍 Messages Sent Debug - Total Messages:", totalMessages);

      // Calculate percentages
      let aiPercentage = 0;
      let humanPercentage = 0;

      if (totalMessages > 0) {
        aiPercentage = Math.round((aiCount / totalMessages) * 100);
        humanPercentage = Math.round((humanCount / totalMessages) * 100);

        // Ensure percentages add up to 100% (handle rounding)
        if (aiPercentage + humanPercentage !== 100) {
          if (aiCount >= humanCount) {
            aiPercentage = 100 - humanPercentage;
          } else {
            humanPercentage = 100 - aiPercentage;
          }
        }
      }

      // Calculate comparison period if provided
      let change = "same as last month";
      if (comparisonPeriod && startDate && endDate) {
        // Calculate previous period dates
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        let prevStartDate, prevEndDate;
        if (comparisonPeriod === 'week') {
          prevStartDate = new Date(startDateObj.getTime() - (7 * 24 * 60 * 60 * 1000));
          prevEndDate = new Date(endDateObj.getTime() - (7 * 24 * 60 * 60 * 1000));
        } else { // month
          prevStartDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() - 1, startDateObj.getDate());
          prevEndDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 1, endDateObj.getDate());
        }

        const prevPeriodMessages = await storage.getOutboundMessages(
          userId, 
          prevStartDate.toISOString().split('T')[0], 
          prevEndDate.toISOString().split('T')[0]
        );

        const prevTotalMessages = prevPeriodMessages.ai.length + prevPeriodMessages.human.length;

        if (prevTotalMessages > 0) {
          const percentChange = Math.round(((totalMessages - prevTotalMessages) / prevTotalMessages) * 100);
          if (percentChange > 0) {
            change = `+${percentChange}% vs last ${comparisonPeriod}`;
          } else if (percentChange < 0) {
            change = `${percentChange}% vs last ${comparisonPeriod}`;
          } else {
            change = `same as last ${comparisonPeriod}`;
          }
        }
      }

      res.json({
        totalMessages,
        aiMessages: aiCount,
        humanMessages: humanCount,
        aiPercentage,
        humanPercentage,
        change
      });

    } catch (error) {
      console.error("Error calculating messages sent:", error);
      res.status(500).json({ message: "Failed to calculate messages sent" });
    }
  });

  // Conversations Per Hour Analytics endpoint
  app.get('/api/analytics/conversations-per-hour', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate, comparisonPeriod } = req.query;

      console.log("🔍 Messages Received Per Hour Debug - User ID:", userId);
      console.log("🔍 Messages Received Per Hour Debug - Date Range:", { startDate, endDate });
      console.log("🔍 Messages Received Per Hour Debug - Comparison Period:", comparisonPeriod);

      // Get inbound customer messages only from legitimate conversations
      const inboundMessages = await storage.getInboundCustomerMessages(userId, startDate, endDate);

      console.log("🔍 Messages Received Per Hour Debug - Customer Messages found:", inboundMessages.length);

      // Initialize hourly data array (24 hours)
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour: hour === 0 ? '12am' : hour === 12 ? '12pm' : hour < 12 ? `${hour}am` : `${hour - 12}pm`,
        hourValue: hour,
        messages: 0
      }));

      if (inboundMessages.length > 0) {
        // Calculate date range for averaging
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        console.log("🔍 Messages Received Per Hour Debug - Days in range:", daysDiff);

        // Count customer messages received by hour
        const messagesByHour: { [key: number]: number } = {};
        inboundMessages.forEach((message: any) => {
          if (message.createdAt) {
            const messageDate = new Date(message.createdAt);
            const hour = messageDate.getHours();
            messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
          }
        });

        console.log("🔍 Messages Received Per Hour Debug - Messages by hour:", messagesByHour);

        // Show total messages for date ranges, actual data for today
        const isToday = startDate === endDate && startDate === new Date().toISOString().split('T')[0];

        hourlyData.forEach(item => {
          const count = messagesByHour[item.hourValue] || 0;
          // Always show actual total count, not average
          item.messages = count;
        });
      }

      console.log("🔍 Messages Received Per Hour Debug - Final hourly data:", hourlyData.slice(10, 14));

      res.json({
        hourlyData,
        totalInboundMessages: inboundMessages.length,
        isToday: startDate === endDate && startDate === new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      console.error("Error calculating messages received per hour:", error);
      res.status(500).json({ message: "Failed to calculate messages received per hour" });
    }
  });

  // FAQ Analysis endpoint
  app.get('/api/faq-analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;

      console.log("🔍 FAQ Analysis Debug - User ID:", userId);
      console.log("🔍 FAQ Analysis Debug - Date Range:", { startDate, endDate });

      // Get all customer messages within date range
      const messages = await storage.getMessagesForFaqAnalysis(userId, startDate, endDate);

      console.log("🔍 FAQ Analysis Debug - Messages found:", messages.length);
      console.log("🔍 FAQ Analysis Debug - Sample messages:", messages.slice(0, 3).map(m => ({ content: m.content, createdAt: m.createdAt })));

      if (!messages || messages.length === 0) {
        return res.json([]);
      }

      // Get existing FAQs to check against
      const business = await storage.getBusiness(userId);
      const existingFaqs = business?.faqs ? JSON.parse(business.faqs) : [];
      const existingQuestions = existingFaqs.map((faq: any) => faq.question.toLowerCase());

      // Use actual customer questions instead of AI-generated ones
      const actualQuestions = messages.map(msg => msg.content).filter(content => {
        // Filter for actual questions
        return content.includes('?') || 
               content.toLowerCase().startsWith('what') ||
               content.toLowerCase().startsWith('how') ||
               content.toLowerCase().startsWith('when') ||
               content.toLowerCase().startsWith('where') ||
               content.toLowerCase().startsWith('why') ||
               content.toLowerCase().startsWith('can') ||
               content.toLowerCase().startsWith('do you') ||
               content.toLowerCase().startsWith('does') ||
               content.toLowerCase().startsWith('tell me');
      });

      console.log("🔍 FAQ Analysis Debug - Actual customer questions:", actualQuestions);

      // Group questions by semantic intent using AI analysis
      const questionGroups = await groupQuestionsByIntent(actualQuestions);

      console.log("🔍 FAQ Analysis Debug - Question groups by semantic intent:", questionGroups);

      // Get top 5 and mark if already in FAQ
      const topQuestions = questionGroups
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)
        .map((group: any) => ({
          ...group,
          isInFaq: existingQuestions.some((existing: any) => 
            group.question.toLowerCase().includes(existing) || 
            existing.includes(group.question.toLowerCase())
          )
        }));

      res.json(topQuestions);
    } catch (error) {
      console.error("Error analyzing FAQs:", error);
      res.status(500).json({ message: "Failed to analyze FAQs" });
    }
  });
}