import { Router } from 'express';
import { readSiteData } from '../utils';
import { eachDayOfInterval, format, parseISO, getDay } from 'date-fns';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Add authentication middleware
router.use(authenticateToken);

router.get('/availability/:site/:userId/:year', async (req, res) => {
  try {
    const { site, userId, year } = req.params;
    const siteData = await readSiteData(site);
    
    // Find user
    const user = siteData.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get site configuration
    const workWeekDays = siteData.app.workWeekDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayParts = siteData.app.dayParts || ['am', 'pm'];

    // Get availability settings or use site defaults
    let availabilityArray = [];
    
    if (user.settings?.availability) {
      // If availability is an array, use it directly
      if (Array.isArray(user.settings.availability)) {
        availabilityArray = user.settings.availability;
      } 
      // If availability is an object, convert it to array format
      else if (typeof user.settings.availability === 'object') {
        availabilityArray = [{
          weeklySchedule: user.settings.availability.weeklySchedule,
          alternateWeekSchedule: user.settings.availability.alternateWeekSchedule,
          startDate: user.settings.availability.startDate,
          endDate: user.settings.availability.endDate,
          repeatPattern: user.settings.availability.repeatPattern
        }];
      }
    }

    // If no availability settings found, use site defaults
    if (!availabilityArray.length) {
      const defaultSchedule = {};
      siteData.app.defaultWeeklySchedule.forEach((daySchedule: any) => {
        const [day, slots] = Object.entries(daySchedule)[0];
        defaultSchedule[day] = slots.reduce((acc: any, slot: string) => {
          acc[slot] = true;
          return acc;
        }, {});
      });

      availabilityArray = [{
        weeklySchedule: defaultSchedule,
        startDate: '2020-01-01',
        endDate: '',
        repeatPattern: 'all'
      }];
    }

    // Create date range for the year
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dayMap = {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    };

    // Calculate availability for each day
    const availability = days.reduce((acc, date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayName = dayMap[getDay(date)];
      
      // Find applicable availability setting
      const setting = availabilityArray
        .filter(a => {
          const start = parseISO(a.startDate);
          const end = a.endDate ? parseISO(a.endDate) : new Date(2100, 0, 1);
          return date >= start && date <= end;
        })
        .pop();

      if (!setting) {
        acc[dateStr] = { am: false, pm: false };
        return acc;
      }

      if (setting.repeatPattern === 'evenodd' && setting.alternateWeekSchedule) {
        const weekNumber = Math.ceil((date.getTime() - parseISO(setting.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
        const schedule = weekNumber % 2 === 0 ? setting.weeklySchedule : setting.alternateWeekSchedule;
        acc[dateStr] = schedule[dayName] || { am: false, pm: false };
      } else {
        acc[dateStr] = setting.weeklySchedule[dayName] || { am: false, pm: false };
      }

      return acc;
    }, {});

    res.json({
      year,
      userId,
      workWeekDays,
      dayParts,
      availability
    });

  } catch (error) {
    console.error('Error generating availability report:', error);
    res.status(500).json({ 
      message: 'Failed to generate availability report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as reportRouter };