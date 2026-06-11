const fs = require('fs');
const mammoth = require('mammoth');
const {
  Document, Packer, Paragraph, TextRun,
  HeadingLevel, AlignmentType, LevelFormat
} = require('docx');

// ─── 解析微信读书笔记 ───────────────────────────────────────────────
function parseNotes(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
  const blocks = [];

  const DATE_THOUGHT_RE = /^\d{4}\/\d{2}\/\d{2}\s+发表想法/;
  const QUOTE_RE = /^原文[：:]\s*/;

  let i = 0;
  let pendingThought = null;

  while (i < lines.length) {
    let line = lines[i];

    // 去掉开头的 * 或 • 符号
    line = line.replace(/^[\*•·]\s*/, '');

    if (!line) { i++; continue; }

    // 1. 日期 + 发表想法 → 下一行是想法内容
    if (DATE_THOUGHT_RE.test(line)) {
      let j = i + 1;
      while (j < lines.length) {
        let next = lines[j].replace(/^[\*•·]\s*/, '').trim();
        if (next) {
          pendingThought = next;
          i = j + 1;
          break;
        }
        j++;
      }
      if (j >= lines.length) i++;
      continue;
    }

    // 2. 原文：...
    if (QUOTE_RE.test(line)) {
      const text = line.replace(QUOTE_RE, '');
      blocks.push({ type: 'quote', text, thought: pendingThought });
      pendingThought = null;
      i++;
      continue;
    }

    // 3. 章节标题判断
    const isHeading = (
      (/第.{1,3}部分/.test(line) || /第.{1,3}章/.test(line) ||
       /附录/.test(line) || /作者的话/.test(line) ||
       /星辰之下/.test(line) || /写在最后/.test(line)) &&
      line.length < 60
    ) || (line.startsWith('《') && line.endsWith('》'));

    if (isHeading) {
      if (pendingThought) {
        blocks.push({ type: 'orphan_thought', text: pendingThought });
        pendingThought = null;
      }
      blocks.push({ type: 'heading', text: line });
      i++;
      continue;
    }

    // 4. 普通文本 → 划线摘录
    blocks.push({ type: 'quote', text: line, thought: pendingThought });
    pendingThought = null;
    i++;
  }

  if (pendingThought) {
    blocks.push({ type: 'orphan_thought', text: pendingThought });
  }

  return blocks;
}

// ─── 生成 Word ─────────────────────────────────────────────────────
function buildDoc(blocks) {
  const paragraphs = [];

  for (const block of blocks) {
    if (block.type === 'heading') {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: block.text, bold: true, size: 28 })],
          spacing: { before: 360, after: 120 },
        })
      );
    } else if (block.type === 'quote') {
      const runs = [new TextRun({ text: block.text, size: 24 })];
      if (block.thought) {
        runs.push(
          new TextRun({
            text: `（${block.thought}）`,
            size: 24,
            color: '888888',
          })
        );
      }
      paragraphs.push(
        new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: runs,
          spacing: { before: 80, after: 80 },
        })
      );
    } else if (block.type === 'orphan_thought') {
      paragraphs.push(
        new Paragraph({
          numbering: { reference: 'bullets', level: 0 },
          children: [
            new TextRun({
              text: `（${block.text}）`,
              size: 24,
              color: '888888',
              italics: true,
            }),
          ],
          spacing: { before: 80, after: 80 },
        })
      );
    }
  }

  return new Document({
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: paragraphs,
    }],
  });
}

// ─── 主程序 ─────────────────────────────────────────────────────────
async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] || '输出.docx';

  if (!inputPath) {
    console.log('用法: node format_notes_v2.js 输入文件.docx 输出文件.docx');
    console.log('  或: node format_notes_v2.js 输入文件.txt 输出文件.docx');
    process.exit(1);
  }

  let raw;

  // 根据扩展名决定读取方式
  if (inputPath.endsWith('.docx')) {
    console.log('📖 正在读取 Word 文件...');
    const result = await mammoth.extractRawText({ path: inputPath });
    raw = result.value;
  } else {
    console.log('📖 正在读取文本文件...');
    raw = fs.readFileSync(inputPath, 'utf8');
  }

  const blocks = parseNotes(raw);
  const doc = buildDoc(blocks);

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  const counts = blocks.reduce((acc, b) => { acc[b.type] = (acc[b.type] || 0) + 1; return acc; }, {});
  console.log(`✅ 输出完成：${outputPath}`);
  console.log(`共处理 ${blocks.length} 个块：`);
  console.log(`  📌 章节标题: ${counts.heading || 0}`);
  console.log(`  📝 划线摘录: ${counts.quote || 0}`);
  console.log(`  💭 其中带想法: ${blocks.filter(b => b.type === 'quote' && b.thought).length}`);
}

main().catch(err => {
  console.error('❌ 出错了:', err.message);
});
