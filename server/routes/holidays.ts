import { Router } from "express";
import { readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get("/:year", async (req, res) => {
  try {
    const filePath = join(__dirname, "../data/holidays.json");
    const data = await readFile(filePath, "utf-8");
    const holidays = JSON.parse(data);

    const year = req.params.year;
    const location = (req.query.location as string) || "BE";

    if (!holidays[location] || !holidays[location][year]) {
      return res
        .status(404)
        .json({
          message: `No holidays found for year ${year} and location ${location}`,
        });
    }

    res.json(holidays[location][year]);
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
});

export { router as holidaysRouter };
