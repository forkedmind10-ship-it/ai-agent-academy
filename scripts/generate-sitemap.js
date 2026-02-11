#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://ai-agent-academy.vercel.app';
const OUTPUT_FILE = 'sitemap.xml';

// Define the pages and their properties
const pages = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/courses',
    changefreq: 'weekly', 
    priority: 0.9,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/tutorials',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/examples',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/playground',
    changefreq: 'monthly',
    priority: 0.7,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/community',
    changefreq: 'weekly',
    priority: 0.6,
    lastmod: new Date().toISOString().split('T')[0]
  }
];

// Function to generate sitemap XML
function generateSitemap(pages) {
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  pages.forEach(page => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${DOMAIN}${page.url}</loc>\n`;
    sitemap += `    <lastmod>${page.lastmod}</lastmod>\n`;
    sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${page.priority}</priority>\n`;
    sitemap += '  </url>\n';
  });
  
  sitemap += '</urlset>\n';
  return sitemap;
}

// Function to scan for additional pages
function scanForPages(directory) {
  const additionalPages = [];
  
  try {
    // Scan courses directory
    const coursesDir = path.join(directory, 'courses');
    if (fs.existsSync(coursesDir)) {
      const courses = fs.readdirSync(coursesDir)
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          url: `/courses/${file.replace('.md', '')}`,
          changefreq: 'monthly',
          priority: 0.7,
          lastmod: new Date().toISOString().split('T')[0]
        }));
      additionalPages.push(...courses);
    }
    
    // Scan tutorials directory
    const tutorialsDir = path.join(directory, 'tutorials');
    if (fs.existsSync(tutorialsDir)) {
      const tutorials = fs.readdirSync(tutorialsDir)
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          url: `/tutorials/${file.replace('.md', '')}`,
          changefreq: 'monthly',
          priority: 0.8,
          lastmod: new Date().toISOString().split('T')[0]
        }));
      additionalPages.push(...tutorials);
    }
    
    // Scan examples directory
    const examplesDir = path.join(directory, 'examples');
    if (fs.existsSync(examplesDir)) {
      const examples = fs.readdirSync(examplesDir)
        .filter(file => file.endsWith('.py') || file.endsWith('.js'))
        .map(file => ({
          url: `/examples/${file}`,
          changefreq: 'monthly',
          priority: 0.6,
          lastmod: new Date().toISOString().split('T')[0]
        }));
      additionalPages.push(...examples);
    }
  } catch (error) {
    console.warn('Warning: Could not scan directories for additional pages:', error.message);
  }
  
  return additionalPages;
}

// Main function
function main() {
  console.log('🗺️ Generating sitemap...');
  
  const currentDir = process.cwd();
  console.log(`Working directory: ${currentDir}`);
  
  // Scan for additional pages
  const additionalPages = scanForPages(currentDir);
  const allPages = [...pages, ...additionalPages];
  
  console.log(`Found ${allPages.length} pages to include in sitemap`);
  
  // Generate sitemap
  const sitemapContent = generateSitemap(allPages);
  
  // Write sitemap to file
  const outputPath = path.join(currentDir, OUTPUT_FILE);
  fs.writeFileSync(outputPath, sitemapContent, 'utf8');
  
  console.log(`✅ Sitemap generated successfully: ${outputPath}`);
  console.log(`📊 Pages included: ${allPages.length}`);
  
  // Also generate robots.txt if it doesn't exist
  const robotsPath = path.join(currentDir, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    const robotsContent = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml

# Block admin areas (if any in the future)
Disallow: /admin/
Disallow: /.env
Disallow: /config/
`;
    
    fs.writeFileSync(robotsPath, robotsContent, 'utf8');
    console.log(`🤖 Generated robots.txt: ${robotsPath}`);
  }
  
  console.log('🎉 Sitemap generation complete!');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSitemap, scanForPages };