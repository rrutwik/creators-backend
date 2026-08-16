export interface Blog {
  title: string;
  slug: string;
  publishedAt: Date;
  readTime: string;
  tags: string[];
  content: string;
  excerpt?: string;
}
