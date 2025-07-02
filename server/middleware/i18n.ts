import { Request, Response, NextFunction } from 'express';
import { I18n, Language, globalI18n } from '../i18n/index.js';
import { AuthRequest } from '../types.js';
import { getUsers } from '../services/users.js';

// Extend Express Request to include i18n
declare global {
  namespace Express {
    interface Request {
      i18n: I18n;
    }
  }
}

// Cache user language preferences to avoid repeated database lookups
const userLanguageCache = new Map<string, Language>();

export async function i18nMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // Create a new i18n instance for this request
    const i18n = new I18n();
    
    // Default language
    let language: Language = 'nl';
    
    // First priority: Check if language is specified in query params
    if (req.query.lang && ['en', 'fr', 'nl'].includes(req.query.lang as string)) {
      language = req.query.lang as Language;
    } 
    // Second priority: Use authenticated user's language preference
    else if (req.user?.id) {
      // Check cache first
      if (userLanguageCache.has(req.user.id)) {
        language = userLanguageCache.get(req.user.id) as Language;
      } else {
        try {
          // Get user's language preference from database
          const users = await getUsers(req.user.site);
          const currentUser = users.find(u => u.id === req.user?.id);
          
          if (currentUser?.settings?.language) {
            language = currentUser.settings.language as Language;
            // Cache the result
            userLanguageCache.set(req.user.id, language);
          }
        } catch (error) {
          console.warn('Failed to get user language preference:', error);
        }
      }
    }
    // Third priority: Check Accept-Language header
    else if (req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'].split(',')[0].trim().substring(0, 2).toLowerCase();
      if (['en', 'fr', 'nl'].includes(acceptLanguage)) {
        language = acceptLanguage as Language;
      }
    }
    
    // Set the language for this request
    i18n.setLanguage(language);
    
    // Also update the global instance (for services that don't have access to req)
    globalI18n.setLanguage(language);
    
    // Attach i18n to the request object
    req.i18n = i18n;
    
    // Add language header to response
    res.setHeader('Content-Language', language);
    
    next();
  } catch (error) {
    console.error('Error in i18n middleware:', error);
    next();
  }
}