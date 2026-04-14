// 检查空值问题

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'tracks_full.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const emptyIssues = [];

data.forEach(track => {
  const id = track.id;
  const title = track.title;
  const table = track.table;

  if (!table || table.length === 0) {
    emptyIssues.push(`Track ${id} [${title}]: 没有三栏对照数据`);
    return;
  }

  table.forEach((row, idx) => {
    const rowLabel = `Track ${id} 第${idx + 1}行`;

    // 检查空值
    if (!row.ja || row.ja.trim() === '') {
      emptyIssues.push(`${rowLabel}: 日语列为空`);
    }
    if (!row.romaji || row.romaji.trim() === '') {
      emptyIssues.push(`${rowLabel}: 罗马音列为空`);
    }
    if (!row.zh || row.zh.trim() === '') {
      emptyIssues.push(`${rowLabel}: 中文列为空`);
    }
  });
});

// 输出结果
console.log(`共检查 ${data.length} 条记录`);
console.log(`发现 ${emptyIssues.length} 个空值问题\n`);

if (emptyIssues.length > 0) {
  emptyIssues.forEach(issue => console.log(`❌ ${issue}`));
  process.exit(1);
} else {
  console.log('✅ 没有空值问题！');
  process.exit(0);
}
