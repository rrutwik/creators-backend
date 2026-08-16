import { model, Schema, Document } from 'mongoose';
import { Blog } from '@interfaces/blog.interface';

const BlogSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    publishedAt: { type: Date, required: true, index: -1 },
    readTime: { type: String, required: true },
    tags: { type: [String], required: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

export const BlogModel = model<Blog & Document>('blog', BlogSchema);
BlogModel.syncIndexes({ background: true });
