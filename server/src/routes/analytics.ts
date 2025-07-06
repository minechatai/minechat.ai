// server/src/routes/analytics.ts

import { Express } from "express";
import { storage } from "../models/storage";
import { isAuthenticated } from "../../replitAuth";
import {
  analyzeMessagesForQuestions,
  groupQuestionsByIntent,
  groupSimilarQuestions,
} from "../services/analyticsService";

export function setupAnalyticsRoutes(app: Express) {
  // Get general analytics
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
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
  app.get(
    "/api/analytics/time-saved",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { startDate, endDate, comparisonPeriod } = req.query;

        console.log("🔍 Time Saved Debug - User ID:", userId);
        console.log("🔍 Time Saved Debug - Date Range:", {
          startDate,
          endDate,
        });
        console.log(
          "🔍 Time Saved Debug - Comparison Period:",
          comparisonPeriod,
        );

        // Get AI messages from legitimate customer conversations only
        const aiMessages = await storage.getCustomerAiMessages(
          userId,
          startDate as string,
          endDate as string,
        );
        console.log(
          "🔍 Time Saved Debug - AI Messages found:",
          aiMessages.length,
        );

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
          const startDateObj = new Date(startDate as string);
          const endDateObj = new Date(endDate as string);
          const daysDiff =
            Math.ceil(
              (endDateObj.getTime() - startDateObj.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;

          const prevEndDate = new Date(startDateObj);
          prevEndDate.setDate(prevEndDate.getDate() - 1);
          const prevStartDate = new Date(prevEndDate);
          prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1);

          const prevAiMessages = await storage.getCustomerAiMessages(
            userId,
            prevStartDate.toISOString().split("T")[0],
            prevEndDate.toISOString().split("T")[0],
          );

          const prevTotalMinutes = prevAiMessages.length * minutesPerResponse;

          if (totalMinutes > prevTotalMinutes) {
            const diff = totalMinutes - prevTotalMinutes;
            change = `+${diff} mins vs last period`;
          } else if (totalMinutes < prevTotalMinutes) {
            const diff = prevTotalMinutes - totalMinutes;
            change = `-${diff} mins vs last period`;
          }
        }

        res.json({
          timeSaved,
          totalMinutes,
          aiResponseCount: aiMessages.length,
          change,
          period: { startDate, endDate },
        });
      } catch (error) {
        console.error("Error calculating time saved:", error);
        res.status(500).json({ message: "Failed to calculate time saved" });
      }
    },
  );

  // Question Analysis endpoint
  app.get(
    "/api/analytics/questions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { startDate, endDate } = req.query;

        // Get all customer messages from the specified period
        const messages = await storage.getCustomerMessages(
          userId,
          startDate as string,
          endDate as string,
        );

        // Extract business questions using AI
        const businessQuestions = await analyzeMessagesForQuestions(
          messages,
          userId,
        );

        // Group questions by intent/topic
        const groupedQuestions =
          await groupQuestionsByIntent(businessQuestions);

        // Group similar questions together
        const similarGroups = groupSimilarQuestions(businessQuestions);

        res.json({
          totalQuestions: businessQuestions.length,
          groupedByIntent: groupedQuestions,
          similarGroups: similarGroups,
          period: { startDate, endDate },
        });
      } catch (error) {
        console.error("Error analyzing questions:", error);
        res.status(500).json({ message: "Failed to analyze questions" });
      }
    },
  );

  // FAQ Generation endpoint
  app.post(
    "/api/analytics/generate-faq",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const { startDate, endDate, minCount = 2 } = req.body;

        // Get customer messages and analyze questions
        const messages = await storage.getCustomerMessages(
          userId,
          startDate,
          endDate,
        );
        const businessQuestions = await analyzeMessagesForQuestions(
          messages,
          userId,
        );
        const groupedQuestions = groupSimilarQuestions(businessQuestions);

        // Filter groups that appear frequently enough
        const frequentQuestions = groupedQuestions
          .filter((group) => group.count >= minCount)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10); // Top 10 most frequent questions

        // Generate FAQ format
        const faq = frequentQuestions.map((group) => ({
          question: group.question,
          frequency: group.count,
          variants: group.variants,
          suggestedAnswer: `This question was asked ${group.count} times. Please provide a comprehensive answer.`,
        }));

        res.json({
          generatedFAQ: faq,
          totalQuestionsAnalyzed: businessQuestions.length,
          period: { startDate, endDate },
        });
      } catch (error) {
        console.error("Error generating FAQ:", error);
        res.status(500).json({ message: "Failed to generate FAQ" });
      }
    },
  );
}
