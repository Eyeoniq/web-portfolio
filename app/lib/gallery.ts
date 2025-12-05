import fs from 'fs';
import path from 'path';

import type { GalleryItem, GallerySubItem } from './gallery-types';

export function getGalleryStructure(filterFolder?: string): GalleryItem[] {
  const picsDir = path.join(process.cwd(), 'public', 'pics');
  
  if (!fs.existsSync(picsDir)) {
    return [];
  }

  let parentFolders = fs.readdirSync(picsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();
  
  if (filterFolder) {
    parentFolders = parentFolders.filter(name => name === filterFolder);
  }

  const allItems: GalleryItem[] = [];

  parentFolders.forEach(parentFolder => {
    const parentPath = path.join(picsDir, parentFolder);
    
    // For renders folder, distribute items individually
    if (parentFolder === 'renders') {
      const contents = fs.readdirSync(parentPath, { withFileTypes: true })
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });
      
      contents.forEach(item => {
        if (item.isDirectory()) {
          // Handle subfolders like "Set Designs"
          const subFolderPath = path.join(parentPath, item.name);
          const subFiles = fs.readdirSync(subFolderPath, { withFileTypes: true });
          
          const items: GallerySubItem[] = subFiles
            .filter(file => {
              const ext = path.extname(file.name).toLowerCase();
              return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mov', '.avi'].includes(ext);
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(file => {
              const ext = path.extname(file.name).toLowerCase();
              let mediaType: 'image' | 'video' | 'gif' = 'image';
              
              if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
                mediaType = 'video';
              } else if (ext === '.gif') {
                mediaType = 'gif';
              }
              
              return {
                name: file.name,
                type: mediaType,
                path: `/pics/${parentFolder}/${item.name}/${file.name}`
              };
            });

          allItems.push({
            name: item.name,
            path: `/pics/${parentFolder}/${item.name}`,
            items
          });
        } else {
          // Handle individual files at root level
          const ext = path.extname(item.name).toLowerCase();
          if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
            let mediaType: 'image' | 'video' | 'gif' = 'image';
            
            if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
              mediaType = 'video';
            } else if (ext === '.gif') {
              mediaType = 'gif';
            }
            
            // Create individual gallery item for each file
            const nameWithoutExt = path.parse(item.name).name;
            allItems.push({
              name: nameWithoutExt,
              path: `/pics/${parentFolder}`,
              items: [{
                name: item.name,
                type: mediaType,
                path: `/pics/${parentFolder}/${item.name}`
              }]
            });
          }
        }
      });
    } else {
      // Original subfolder structure for other folders
      const subContents = fs.readdirSync(parentPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));

      subContents.forEach(subFolder => {
        const subFolderPath = path.join(parentPath, subFolder.name);
        const contents = fs.readdirSync(subFolderPath, { withFileTypes: true });

        const items: GallerySubItem[] = contents
          .filter(item => {
            if (item.isDirectory()) return true;
            const ext = path.extname(item.name).toLowerCase();
            return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mov', '.avi'].includes(ext);
          })
          .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
          })
          .map(item => {
            if (item.isDirectory()) {
              const deepFolderPath = path.join(subFolderPath, item.name);
              const images = fs.readdirSync(deepFolderPath, { withFileTypes: true })
                .filter(file => {
                  const ext = path.extname(file.name).toLowerCase();
                  return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm', '.mov', '.avi'].includes(ext);
                })
                .map(file => file.name)
                .sort();

              return {
                name: item.name,
                type: 'folder' as const,
                path: `/pics/${parentFolder}/${subFolder.name}/${item.name}`,
                images
              };
            } else {
              const ext = path.extname(item.name).toLowerCase();
              let mediaType: 'image' | 'video' | 'gif' = 'image';
              
              if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
                mediaType = 'video';
              } else if (ext === '.gif') {
                mediaType = 'gif';
              }
              
              return {
                name: item.name,
                type: mediaType,
                path: `/pics/${parentFolder}/${subFolder.name}/${item.name}`
              };
            }
          });

        allItems.push({
          name: subFolder.name,
          path: `/pics/${parentFolder}/${subFolder.name}`,
          items
        });
      });
    }
  });

  return allItems;
}

export function getThumbnail(folderPath: string): string | null {
  const picsDir = path.join(process.cwd(), 'public', folderPath);
  
  if (!fs.existsSync(picsDir)) {
    return null;
  }

  // Try to find thumb.png first
  const thumbPath = path.join(picsDir, 'thumb.png');
  if (fs.existsSync(thumbPath)) {
    return `${folderPath}/thumb.png`;
  }

  // Otherwise get first image
  const files = fs.readdirSync(picsDir, { withFileTypes: true });
  for (const file of files) {
    if (file.isFile()) {
      const ext = path.extname(file.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
        return `${folderPath}/${file.name}`;
      }
    }
  }

  return null;
}

