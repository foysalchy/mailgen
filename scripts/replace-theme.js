const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Replace all blue gradient buttons and accents with #925ce9
code = code.replace(/from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500/g, 'from-[#925ce9] to-[#7e43e5] hover:from-[#8247e5] hover:to-[#6d32d5]');
code = code.replace(/from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500/g, 'from-[#925ce9] to-indigo-600 hover:from-[#8247e5] hover:to-indigo-500');
code = code.replace(/from-blue-600 to-indigo-500/g, 'from-[#925ce9] to-indigo-600');
code = code.replace(/bg-blue-600 hover:bg-blue-500/g, 'bg-[#925ce9] hover:bg-[#7e43e5]');
code = code.replace(/shadow-blue-600\/30/g, 'shadow-[#925ce9]/30');
code = code.replace(/shadow-blue-600\/25/g, 'shadow-[#925ce9]/25');
code = code.replace(/shadow-blue-600\/40/g, 'shadow-[#925ce9]/40');
code = code.replace(/shadow-blue-500\/20/g, 'shadow-[#925ce9]/20');
code = code.replace(/bg-blue-600\/10 hover:bg-blue-600\/20 text-blue-400 border border-blue-500\/30/g, 'bg-[#925ce9]/10 hover:bg-[#925ce9]/20 text-[#925ce9] border border-[#925ce9]/30');
code = code.replace(/bg-blue-600\/10 hover:bg-blue-600\/20 text-blue-400 border border-blue-500\/20/g, 'bg-[#925ce9]/10 hover:bg-[#925ce9]/20 text-[#925ce9] border border-[#925ce9]/20');
code = code.replace(/bg-blue-600\/20 hover:bg-blue-600\/30 text-blue-400 border border-blue-500\/30/g, 'bg-[#925ce9]/20 hover:bg-[#925ce9]/30 text-[#925ce9] border border-[#925ce9]/30');
code = code.replace(/bg-blue-600\/10 hover:bg-blue-600\/20 text-xs font-medium text-blue-400 rounded-lg border border-blue-500\/30/g, 'bg-[#925ce9]/10 hover:bg-[#925ce9]/20 text-xs font-medium text-[#925ce9] rounded-lg border border-[#925ce9]/30');

// compose editor tab active
code = code.replace(/'bg-blue-600 text-white font-medium shadow'/g, "'bg-[#925ce9] text-white font-medium shadow'");

// Checkbox and selection styling
code = code.replace(/text-blue-600 bg-slate-800 border-slate-700/g, 'text-[#925ce9] bg-slate-800 border-slate-700 focus:ring-0');
code = code.replace(/bg-blue-600\/10 border-l-2 border-blue-500/g, 'bg-[#925ce9]/10 border-l-2 border-[#925ce9]');

// Single bg-blue-600 and text-blue-600
code = code.replace(/bg-blue-600 text-white/g, 'bg-[#925ce9] text-white');
code = code.replace(/text-blue-600 block mb-1/g, 'text-[#925ce9] block mb-1');
code = code.replace(/font-black text-blue-600/g, 'font-black text-[#925ce9]');

fs.writeFileSync('app/page.tsx', code, 'utf8');
console.log('Successfully updated app/page.tsx with #925ce9 colors');
