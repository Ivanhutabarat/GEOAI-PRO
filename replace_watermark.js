import fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/components/Modules/*.tsx');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(
      />Data Stream Visualization by Ivan Hutabarat</g, 
      '>{import.meta.env.VITE_CHART_WATERMARK}<'
  );
  fs.writeFileSync(file, content);
});
console.log('Watermarks replaced');
