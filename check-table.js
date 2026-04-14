// 检查三栏对照数据

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data', 'tracks_full.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const issues = [];

data.forEach(track => {
  const id = track.id;
  const title = track.title;
  const table = track.table;

  if (!table || table.length === 0) {
    issues.push(`Track ${id} [${title}]: 没有三栏对照数据`);
    return;
  }

  table.forEach((row, idx) => {
    const rowLabel = `Track ${id} 第${idx + 1}行`;

    // 检查空值
    if (!row.ja || row.ja.trim() === '') {
      issues.push(`${rowLabel}: 日语列为空`);
    }
    if (!row.romaji || row.romaji.trim() === '') {
      issues.push(`${rowLabel}: 罗马音列为空`);
    }
    if (!row.zh || row.zh.trim() === '') {
      issues.push(`${rowLabel}: 中文列为空`);
    }

    // 检查是否包含分隔符，如果包含则检查分词数量是否一致
    if (row.ja && row.romaji && row.zh) {
      const jaSplit = row.ja.split(/[、,]\s*/).filter(s => s.trim());
      const romaSplit = row.romaji.split(/[、,]\s*/).filter(s => s.trim());
      const zhSplit = row.zh.split(/[、,]\s*/).filter(s => s.trim());

      const len = jaSplit.length;
      if (len > 1 && (jaSplit.length !== romaSplit.length || jaSplit.length !== zhSplit.length)) {
        issues.push(`${rowLabel}: 分隔符分词数量不一致 - 日语:${jaSplit.length}, 罗马音:${romaSplit.length}, 中文:${zhSplit.length}`);
        issues.push(`  日语: ${row.ja}`);
        issues.push(`  罗马音: ${row.romaji}`);
        issues.push(`  中文: ${row.zh}`);
      }
    }
  });
});

// 输出结果
console.log(`共检查 ${data.length} 条记录`);
console.log(`发现 ${issues.length} 个问题\n`);

if (issues.length > 0) {
  issues.forEach(issue => console.log(`❌ ${issue}`));
  process.exit(1);
} else {
  console.log('✅ 所有三栏对照数据检查通过！');
  process.exit(0);
}
