//server/controllers/chatTemplateController.js
const ChatTemplate = require('../models/chatTemplateModel');

class ChatTemplateController {
  // Create new chat template
  static async createTemplate(req, res) {
    try {
      const {
        templateType,
        category,
        title,
        content,
        variables,
        quickReplies,
        businessHoursOnly,
        priority,
        personalization,
        conditions
      } = req.body;

      const createdBy = req.user.id;

      const template = new ChatTemplate({
        templateType,
        category,
        title,
        content,
        variables: variables || [],
        quickReplies: quickReplies || [],
        businessHoursOnly: businessHoursOnly || false,
        priority: priority || 0,
        personalization: personalization || {},
        conditions: conditions || {},
        createdBy
      });

      await template.save();

      res.status(201).json({
        success: true,
        message: 'Chat template created successfully',
        data: template
      });
    } catch (error) {
      console.error('Error creating chat template:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating chat template',
        error: error.message
      });
    }
  }

  // Get all templates with filtering
  static async getTemplates(req, res) {
    try {
      const {
        templateType,
        category,
        isActive,
        businessHoursOnly,
        limit = 50,
        page = 1,
        sortBy = 'priority',
        sortOrder = 'desc'
      } = req.query;

      // Build query
      const query = {};
      if (templateType) query.templateType = templateType;
      if (category) query.category = category;
      if (isActive !== undefined) query.isActive = isActive === 'true';
      if (businessHoursOnly !== undefined) query.businessHoursOnly = businessHoursOnly === 'true';

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const templates = await ChatTemplate.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(skip)
        .populate('createdBy', 'firstname lastname email');

      const total = await ChatTemplate.countDocuments(query);

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          filters: {
            templateType,
            category,
            isActive,
            businessHoursOnly
          }
        }
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching chat templates',
        error: error.message
      });
    }
  }

  // Get template by ID
  static async getTemplate(req, res) {
    try {
      const { templateId } = req.params;

      const template = await ChatTemplate.findById(templateId)
        .populate('createdBy', 'firstname lastname email')
        .populate('parentTemplate', 'title version');

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching template',
        error: error.message
      });
    }
  }

  // Update template
  static async updateTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const updateData = req.body;

      const template = await ChatTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check permissions (only creator or admin can update)
      if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update templates you created.'
        });
      }

      // Prevent certain fields from being updated
      delete updateData.createdBy;
      delete updateData.createdAt;
      delete updateData.usage;

      const updatedTemplate = await ChatTemplate.findByIdAndUpdate(
        templateId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: updatedTemplate
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating template',
        error: error.message
      });
    }
  }

  // Delete template
  static async deleteTemplate(req, res) {
    try {
      const { templateId } = req.params;

      const template = await ChatTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check permissions
      if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete templates you created.'
        });
      }

      await ChatTemplate.findByIdAndDelete(templateId);

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting template',
        error: error.message
      });
    }
  }

  // Render template with variables
  static async renderTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { variables = {}, context = {} } = req.body;

      const template = await ChatTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Check if template should be shown based on context
      const shouldShow = template.shouldShow(context);
      if (!shouldShow) {
        return res.status(400).json({
          success: false,
          message: 'Template cannot be displayed based on current context'
        });
      }

      // Render the template
      const renderedContent = template.render(variables);

      // Increment usage counter
      await template.incrementUsage();

      res.json({
        success: true,
        data: {
          templateId: template._id,
          renderedContent,
          quickReplies: template.quickReplies,
          metadata: {
            templateType: template.templateType,
            category: template.category,
            variables: template.variables,
            personalization: template.personalization
          }
        }
      });
    } catch (error) {
      console.error('Error rendering template:', error);
      res.status(500).json({
        success: false,
        message: 'Error rendering template',
        error: error.message
      });
    }
  }

  // Get templates by type and category
  static async getTemplatesByTypeAndCategory(req, res) {
    try {
      const { templateType, category } = req.params;
      const { businessHoursOnly, limit = 10 } = req.query;

      const templates = await ChatTemplate.findByTypeAndCategory(
        templateType,
        category,
        businessHoursOnly !== undefined ? businessHoursOnly === 'true' : null
      ).limit(parseInt(limit));

      res.json({
        success: true,
        data: {
          templates,
          filters: {
            templateType,
            category,
            businessHoursOnly
          }
        }
      });
    } catch (error) {
      console.error('Error fetching templates by type and category:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching templates',
        error: error.message
      });
    }
  }

  // Get random template
  static async getRandomTemplate(req, res) {
    try {
      const { templateType, category } = req.params;

      const templates = await ChatTemplate.getRandomTemplate(templateType, category);
      
      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No templates found matching criteria'
        });
      }

      const template = templates[0];
      await ChatTemplate.findByIdAndUpdate(template._id, { 
        $inc: { 'usage.timesUsed': 1 },
        'usage.lastUsed': new Date()
      });

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching random template:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching random template',
        error: error.message
      });
    }
  }

  // Clone template
  static async cloneTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { title, modifications = {} } = req.body;

      const originalTemplate = await ChatTemplate.findById(templateId);
      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          message: 'Original template not found'
        });
      }

      // Create new template based on original
      const clonedTemplate = new ChatTemplate({
        ...originalTemplate.toObject(),
        _id: undefined,
        title: title || `${originalTemplate.title} (Copy)`,
        createdBy: req.user.id,
        parentTemplate: templateId,
        version: 1,
        usage: {
          timesUsed: 0,
          lastUsed: null,
          averageRating: 0,
          totalRatings: 0
        },
        ...modifications
      });

      await clonedTemplate.save();

      res.status(201).json({
        success: true,
        message: 'Template cloned successfully',
        data: clonedTemplate
      });
    } catch (error) {
      console.error('Error cloning template:', error);
      res.status(500).json({
        success: false,
        message: 'Error cloning template',
        error: error.message
      });
    }
  }

  // Rate template
  static async rateTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { rating } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      const template = await ChatTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      await template.addRating(rating);

      res.json({
        success: true,
        message: 'Template rated successfully',
        data: {
          templateId,
          newAverageRating: template.usage.averageRating,
          totalRatings: template.usage.totalRatings
        }
      });
    } catch (error) {
      console.error('Error rating template:', error);
      res.status(500).json({
        success: false,
        message: 'Error rating template',
        error: error.message
      });
    }
  }

  // Get template usage statistics
  static async getTemplateStats(req, res) {
    try {
      const { templateId } = req.params;

      const template = await ChatTemplate.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Get usage over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const ChatMessage = require('../models/chatMessageModel');
      const usageOverTime = await ChatMessage.aggregate([
        {
          $match: {
            'metadata.templateId': template._id,
            timestamp: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      const stats = {
        templateInfo: {
          id: template._id,
          title: template.title,
          templateType: template.templateType,
          category: template.category
        },
        usage: template.usage,
        usageOverTime,
        performance: {
          averageRating: template.usage.averageRating,
          totalRatings: template.usage.totalRatings,
          timesUsed: template.usage.timesUsed,
          lastUsed: template.usage.lastUsed
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching template stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching template statistics',
        error: error.message
      });
    }
  }

  // Create default templates
  static async createDefaultTemplates(req, res) {
    try {
      const createdBy = req.user.id;

      // Check if default templates already exist
      const existingTemplates = await ChatTemplate.countDocuments({
        templateType: 'greeting',
        category: 'greeting'
      });

      if (existingTemplates > 0) {
        return res.status(400).json({
          success: false,
          message: 'Default templates already exist'
        });
      }

      const defaultTemplates = await ChatTemplate.createDefaults(createdBy);

      res.status(201).json({
        success: true,
        message: 'Default templates created successfully',
        data: {
          count: defaultTemplates.length,
          templates: defaultTemplates
        }
      });
    } catch (error) {
      console.error('Error creating default templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating default templates',
        error: error.message
      });
    }
  }

  // Bulk operations
  static async bulkUpdateTemplates(req, res) {
    try {
      const { templateIds, updateData } = req.body;

      if (!Array.isArray(templateIds) || templateIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Template IDs array is required'
        });
      }

      // Verify user has permission to update all templates
      const templates = await ChatTemplate.find({ 
        _id: { $in: templateIds }
      });

      const unauthorizedTemplates = templates.filter(t => 
        t.createdBy.toString() !== req.user.id && req.user.role !== 'admin'
      );

      if (unauthorizedTemplates.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied for some templates'
        });
      }

      // Prevent certain fields from being updated
      delete updateData.createdBy;
      delete updateData.createdAt;
      delete updateData.usage;

      const result = await ChatTemplate.updateMany(
        { _id: { $in: templateIds } },
        { ...updateData, updatedAt: new Date() }
      );

      res.json({
        success: true,
        message: 'Templates updated successfully',
        data: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error bulk updating templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error bulk updating templates',
        error: error.message
      });
    }
  }

  // Search templates
  static async searchTemplates(req, res) {
    try {
      const { 
        query, 
        templateType, 
        category, 
        isActive = true,
        limit = 20,
        page = 1 
      } = req.query;

      // Build search criteria
      const searchCriteria = { isActive };
      
      if (templateType) searchCriteria.templateType = templateType;
      if (category) searchCriteria.category = category;

      // Add text search if query provided
      if (query) {
        searchCriteria.$or = [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { 'variables.description': { $regex: query, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const templates = await ChatTemplate.find(searchCriteria)
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ 'usage.timesUsed': -1, priority: -1 })
        .populate('createdBy', 'firstname lastname');

      const total = await ChatTemplate.countDocuments(searchCriteria);

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          },
          searchQuery: query
        }
      });
    } catch (error) {
      console.error('Error searching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error searching templates',
        error: error.message
      });
    }
  }

  // Get template categories
  static async getTemplateCategories(req, res) {
    try {
      const categories = await ChatTemplate.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            templateTypes: { $addToSet: '$templateType' },
            avgRating: { $avg: '$usage.averageRating' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          categories: categories.map(cat => ({
            name: cat._id,
            count: cat.count,
            templateTypes: cat.templateTypes,
            averageRating: cat.avgRating || 0
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching template categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching template categories',
        error: error.message
      });
    }
  }

  // Export templates
  static async exportTemplates(req, res) {
    try {
      const { 
        templateIds, 
        templateType, 
        category,
        format = 'json'
      } = req.query;

      // Build query
      const query = { isActive: true };
      
      if (templateIds) {
        query._id = { $in: templateIds.split(',') };
      }
      if (templateType) query.templateType = templateType;
      if (category) query.category = category;

      const templates = await ChatTemplate.find(query)
        .populate('createdBy', 'firstname lastname email')
        .sort({ category: 1, templateType: 1, title: 1 });

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = templates.map(template => ({
          id: template._id,
          title: template.title,
          templateType: template.templateType,
          category: template.category,
          content: template.content.replace(/\n/g, '\\n'),
          variables: template.variables.map(v => v.name).join(';'),
          quickReplies: template.quickReplies.map(q => q.text).join(';'),
          isActive: template.isActive,
          priority: template.priority,
          timesUsed: template.usage.timesUsed,
          averageRating: template.usage.averageRating,
          createdBy: template.createdBy ? `${template.createdBy.firstname} ${template.createdBy.lastname}` : '',
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString()
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=chat_templates.csv');
        
        // Simple CSV conversion (in production, use proper CSV library)
        const csvHeaders = Object.keys(csvData[0] || {}).join(',');
        const csvRows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        res.send(csvContent);
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=chat_templates.json');
        
        res.json({
          exportDate: new Date().toISOString(),
          totalTemplates: templates.length,
          templates: templates
        });
      }
    } catch (error) {
      console.error('Error exporting templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting templates',
        error: error.message
      });
    }
  }

  // Import templates
  static async importTemplates(req, res) {
    try {
      const { templates, overwriteExisting = false } = req.body;
      const createdBy = req.user.id;

      if (!Array.isArray(templates) || templates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Templates array is required'
        });
      }

      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const templateData of templates) {
        try {
          // Check if template with same title exists
          const existingTemplate = await ChatTemplate.findOne({ 
            title: templateData.title 
          });

          if (existingTemplate && !overwriteExisting) {
            results.skipped++;
            continue;
          }

          if (existingTemplate && overwriteExisting) {
            // Update existing template
            await ChatTemplate.findByIdAndUpdate(
              existingTemplate._id,
              {
                ...templateData,
                createdBy,
                updatedAt: new Date()
              }
            );
          } else {
            // Create new template
            const newTemplate = new ChatTemplate({
              ...templateData,
              createdBy,
              _id: undefined, // Remove any existing ID
              usage: {
                timesUsed: 0,
                lastUsed: null,
                averageRating: 0,
                totalRatings: 0
              }
            });

            await newTemplate.save();
          }

          results.imported++;
        } catch (error) {
          results.errors.push({
            template: templateData.title || 'Unknown',
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Templates import completed',
        data: results
      });
    } catch (error) {
      console.error('Error importing templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error importing templates',
        error: error.message
      });
    }
  }

  // Validate template content
  static async validateTemplate(req, res) {
    try {
      const { content, variables = [] } = req.body;

      const validation = {
        isValid: true,
        issues: [],
        suggestions: []
      };

      // Check for undefined variables in content
      const variableRegex = /\{(\w+)\}/g;
      const contentVariables = [];
      let match;

      while ((match = variableRegex.exec(content)) !== null) {
        contentVariables.push(match[1]);
      }

      // Check for variables used in content but not defined
      const definedVariableNames = variables.map(v => v.name);
      const undefinedVariables = contentVariables.filter(v => 
        !definedVariableNames.includes(v) && 
        !['currentTime', 'currentDate', 'businessHours'].includes(v) // Built-in variables
      );

      if (undefinedVariables.length > 0) {
        validation.isValid = false;
        validation.issues.push({
          type: 'undefined_variables',
          message: `Undefined variables found: ${undefinedVariables.join(', ')}`,
          variables: undefinedVariables
        });
      }

      // Check for defined variables not used in content
      const unusedVariables = definedVariableNames.filter(v => 
        !contentVariables.includes(v)
      );

      if (unusedVariables.length > 0) {
        validation.suggestions.push({
          type: 'unused_variables',
          message: `Defined variables not used in content: ${unusedVariables.join(', ')}`,
          variables: unusedVariables
        });
      }

      // Check content length
      if (content.length > 2000) {
        validation.issues.push({
          type: 'content_too_long',
          message: 'Content exceeds maximum length of 2000 characters',
          currentLength: content.length,
          maxLength: 2000
        });
        validation.isValid = false;
      }

      // Check for empty content
      if (!content.trim()) {
        validation.issues.push({
          type: 'empty_content',
          message: 'Content cannot be empty'
        });
        validation.isValid = false;
      }

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      console.error('Error validating template:', error);
      res.status(500).json({
        success: false,
        message: 'Error validating template',
        error: error.message
      });
    }
  }

  // Preview template rendering
  static async previewTemplate(req, res) {
    try {
      const { content, variables = {}, sampleVariables = {} } = req.body;

      // Create a temporary template for preview
      const tempTemplate = new ChatTemplate({
        templateType: 'bot_response',
        category: 'general',
        title: 'Preview Template',
        content,
        variables: Object.keys(sampleVariables).map(key => ({
          name: key,
          description: 'Preview variable',
          defaultValue: sampleVariables[key]
        })),
        createdBy: req.user.id
      });

      // Render with provided variables
      const renderedContent = tempTemplate.render({
        ...sampleVariables,
        ...variables
      });

      res.json({
        success: true,
        data: {
          originalContent: content,
          renderedContent,
          variables: {
            provided: variables,
            sample: sampleVariables
          },
          placeholders: tempTemplate.placeholders
        }
      });
    } catch (error) {
      console.error('Error previewing template:', error);
      res.status(500).json({
        success: false,
        message: 'Error previewing template',
        error: error.message
      });
    }
  }
}

module.exports = ChatTemplateController;
