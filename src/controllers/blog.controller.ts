import { NextFunction, Request, Response } from "express";
import { BlogModel } from "@models/blog.model";
import { logger } from "@utils/logger";

class BlogController {
  public getBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 6;
      const search = (req.query.search as string) || "";
      
      const query: any = {};
      
      if (search.trim()) {
        query.$text = { $search: search.trim() };
      }

      let totalPosts: number;
      if (Object.keys(query).length === 0) {
        totalPosts = await BlogModel.estimatedDocumentCount();
      } else {
        totalPosts = await BlogModel.countDocuments(query);
      }
      
      const totalPages = Math.ceil(totalPosts / limit);
      
      const blogs = await BlogModel.find(query)
        .select("-content")
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
        
      res.status(200).json({ 
        data: blogs, 
        meta: {
          total: totalPosts,
          page,
          totalPages,
          limit
        },
        message: "findAll" 
      });
    } catch (error) {
      next(error);
    }
  };

  public getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      const blog = await BlogModel.findOne({ slug }).lean();

      if (!blog) {
        return res.status(404).json({ message: "Blog not found" });
      }

      res.status(200).json({ data: blog, message: "findOne" });
    } catch (error) {
      next(error);
    }
  };

  public createBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blogData = req.body;

      if (!blogData || !blogData.slug || !blogData.title) {
        return res.status(400).json({ message: "Missing required fields: slug and title" });
      }

      logger.info(`Creating/Upserting blog post: ${blogData.slug}`);

      if (!blogData.excerpt && blogData.content) {
        blogData.excerpt = blogData.content.substring(0, 150) + "...";
      }

      const { publishedAt, ...updateData } = blogData;

      const updatedBlog = await BlogModel.findOneAndUpdate(
        { slug: blogData.slug },
        { 
          $set: updateData,
          $setOnInsert: { publishedAt: publishedAt || new Date() }
        },
        { new: true, upsert: true }
      );

      res.status(201).json({ data: updatedBlog, message: "created" });
    } catch (error) {
      logger.error(`Error creating blog: ${error}`);
      next(error);
    }
  };
}

export default BlogController;
