// Security utilities for PhotoSearch AI

export class SecurityManager {
  // Validate file types to prevent malicious uploads
  static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/svg+xml'
  ];

  static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
  static readonly MAX_BATCH_SIZE = 100; // Max files per batch

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Only image files are permitted.`
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.MAX_FILE_SIZE)}.`
      };
    }

    // Check filename for suspicious patterns
    if (this.hasSuspiciousFilename(file.name)) {
      return {
        valid: false,
        error: 'Filename contains suspicious characters.'
      };
    }

    return { valid: true };
  }

  static validateBatch(files: File[]): { valid: boolean; error?: string } {
    if (files.length > this.MAX_BATCH_SIZE) {
      return {
        valid: false,
        error: `Batch size ${files.length} exceeds maximum of ${this.MAX_BATCH_SIZE} files.`
      };
    }

    return { valid: true };
  }

  static sanitizeInput(input: string): string {
    // Remove potentially dangerous characters for search queries
    return input
      .replace(/[<>\"']/g, '') // Remove HTML injection characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .trim()
      .substring(0, 1000); // Limit length
  }

  static sanitizeApiKey(key: string): string {
    // Basic API key validation and sanitization
    return key.replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 100);
  }

  private static hasSuspiciousFilename(filename: string): boolean {
    const suspicious = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,  // Executable extensions
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i  // Reserved Windows names
    ];

    return suspicious.some(pattern => pattern.test(filename));
  }

  private static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Rate limiting for API calls
  static createRateLimiter(maxCalls: number, windowMs: number) {
    const calls: number[] = [];
    
    return () => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Remove old calls outside the window
      while (calls.length > 0 && calls[0] < windowStart) {
        calls.shift();
      }
      
      if (calls.length >= maxCalls) {
        return false; // Rate limit exceeded
      }
      
      calls.push(now);
      return true; // Call allowed
    };
  }
}