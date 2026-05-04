
import fs from 'fs';

const filePath = 'src/integrations/supabase/types.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Add commas to lines ending with } or ] that are followed by a property name or another closing brace
// but specifically focusing on the structure of the Supabase types.

// 1. Fix missing commas between properties in the Tables object
// Patterns like:
//       table_name: {
//         ...
//       }
//       next_table: {
content = content.replace(/(\n\s+})\n(\s+\w+: {)/g, '$1,\n$2');

// 2. Fix missing commas between Row, Insert, Update, Relationships
// Patterns like:
//         Row: {
//           ...
//         }
//         Insert: {
content = content.replace(/(\n\s+})\n(\s+(Insert|Update|Relationships):)/g, '$1,\n$2');

// 3. Fix missing commas inside Relationships array elements
// Patterns like:
//           {
//             ...
//           }
//           {
content = content.replace(/(\n\s+})\n(\s+{)/g, '$1,\n$2');

fs.writeFileSync(filePath, content);
console.log('Fixed missing commas in ' + filePath);
