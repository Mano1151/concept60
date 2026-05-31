export const TOPIC_DESCRIPTIONS = {
  react: "React is a JavaScript library for building user interfaces with reusable components. Next.js is built on React, so you write React components while Next.js adds routing, rendering modes, and optimizations to make apps production-ready.",

  "server-side rendering": "Server-Side Rendering (SSR) means generating HTML on the server for each request so the browser receives ready-to-render pages. In Next.js, SSR improves initial load speed and SEO by letting search engines and users see content immediately without waiting for client JavaScript.",

  "web development": "Web development is the process of building websites and web applications using HTML, CSS, JavaScript, and related tools. Next.js simplifies web development by giving you routing, data fetching patterns, and performance defaults so you can focus on building features.",

  performance: "Performance describes how fast a site loads and how smoothly it responds to users. Next.js helps performance with code splitting, optimized image handling, and smart rendering strategies so pages load faster and feel snappy.",

  framework: "A framework provides structure and helpful defaults for building applications. Next.js is a React framework that adds file-based routing, server rendering, API routes, and build optimizations to make building full-stack apps easier.",

  routing: "Routing determines how users navigate between pages in an app. Next.js uses file-based routing: create files in the `pages` or `app` folder and Next.js automatically exposes routes, which keeps navigation simple and predictable.",

  "static site generation": "Static Site Generation (SSG) pre-renders pages at build time into static HTML files. Next.js SSG is great for content that doesn't change often because it delivers very fast pages and can be hosted cheaply on CDNs.",

  "incremental static regeneration": "Incremental Static Regeneration (ISR) lets you update static pages after build time by re-generating them in the background. Next.js supports ISR so you can keep the speed of static pages while updating content periodically.",

  "api routes": "API Routes let you write server-side endpoints alongside your Next.js app without a separate server. Use them for simple back-end tasks like handling forms, authentication, or talking to third-party APIs.",

  "image optimization": "Image optimization automatically serves appropriately sized and optimized images to users. Next.js provides an Image component that resizes, compresses, and serves images in modern formats to improve load times.",

  seo: "SEO (Search Engine Optimization) means making pages easy for search engines to find and understand. Next.js helps SEO through server rendering, meta tags, and fast page loads so content is discoverable and ranks better.",
};

export default TOPIC_DESCRIPTIONS;
