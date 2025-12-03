import { Router } from "express";
import { AuthRequest } from "../types.js";
import { ReportingService } from "../services/reporting.js";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

// Get all saved queries (user can see public + own, admin can see all)
router.get("/saved-queries", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const site = req.user!.site;
    const isAdmin = req.user!.role === 'admin';

    const result = await ReportingService.getSavedQueries(site, userId, isAdmin);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error("Error fetching saved queries:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all predefined queries
router.get("/predefined-queries", async (req: AuthRequest, res) => {
  try {
    const site = req.user!.site;

    const result = await ReportingService.getPredefinedQueries(site);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error("Error fetching predefined queries:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new saved query (admin only)
router.post("/saved-queries", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { name, description, sql_query, parameters, is_public, category } = req.body;
    const userId = req.user!.id;
    const site = req.user!.site;

    if (!name || !sql_query) {
      return res.status(400).json({ error: "Name and SQL query are required" });
    }

    const result = await ReportingService.saveQuery({
      name,
      description: description || '',
      sql_query,
      parameters: parameters || [],
      created_by: userId,
      site,
      is_public: is_public || false,
      category: category || 'general'
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.data);
  } catch (error: any) {
    console.error("Error creating saved query:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a saved query
router.put("/saved-queries/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const result = await ReportingService.updateQuery(id, updates, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error("Error updating saved query:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a saved query
router.delete("/saved-queries/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const result = await ReportingService.deleteQuery(id, userId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ message: "Query deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting saved query:", error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a saved query
router.post("/execute/saved/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { parameters } = req.body;
    const userId = req.user!.id;
    const site = req.user!.site;

    // Get the saved query
    const { data: queries } = await ReportingService.getSavedQueries(
      site,
      userId,
      req.user!.role === 'admin'
    );

    const query = queries?.find(q => q.id === id);
    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }

    const result = await ReportingService.executeQuery(
      query.sql_query,
      parameters || {},
      userId,
      site,
      id,
      'saved'
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      data: result.data,
      executionTime: result.executionTime,
      rowCount: result.data?.length || 0
    });
  } catch (error: any) {
    console.error("Error executing saved query:", error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a predefined query
router.post("/execute/predefined/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { parameters } = req.body;
    const userId = req.user!.id;
    const site = req.user!.site;

    // Get the predefined query
    const { data: queries } = await ReportingService.getPredefinedQueries(site);
    const query = queries?.find(q => q.id === id);

    if (!query) {
      return res.status(404).json({ error: "Query not found" });
    }

    const result = await ReportingService.executeQuery(
      query.sql_query,
      parameters || {},
      userId,
      site,
      id,
      'predefined'
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      data: result.data,
      executionTime: result.executionTime,
      rowCount: result.data?.length || 0
    });
  } catch (error: any) {
    console.error("Error executing predefined query:", error);
    res.status(500).json({ error: error.message });
  }
});

// Execute a custom query (admin only)
router.post("/execute/custom", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { sql_query, parameters } = req.body;
    const userId = req.user!.id;
    const site = req.user!.site;

    if (!sql_query) {
      return res.status(400).json({ error: "SQL query is required" });
    }

    const result = await ReportingService.executeQuery(
      sql_query,
      parameters || {},
      userId,
      site,
      undefined,
      'custom'
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      data: result.data,
      executionTime: result.executionTime,
      rowCount: result.data?.length || 0
    });
  } catch (error: any) {
    console.error("Error executing custom query:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get query execution history
router.get("/execution-history", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const site = req.user!.site;
    const isAdmin = req.user!.role === 'admin';
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await ReportingService.getExecutionHistory(
      site,
      userId,
      isAdmin,
      limit
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    console.error("Error fetching execution history:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export query results (CSV)
router.post("/export/csv", async (req: AuthRequest, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "No data to export" });
    }

    // Generate CSV
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape values containing commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export query results (JSON)
router.post("/export/json", async (req: AuthRequest, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "No data to export" });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="report-${Date.now()}.json"`);
    res.json(data);
  } catch (error: any) {
    console.error("Error exporting JSON:", error);
    res.status(500).json({ error: error.message });
  }
});

// Clear expired cache (admin only)
router.post("/cache/clear", requireAdmin, async (req: AuthRequest, res) => {
  try {
    await ReportingService.clearExpiredCache();
    res.json({ message: "Cache cleared successfully" });
  } catch (error: any) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
