import Link from 'next/link';
import type { DocumentationBlock } from '@/content/docs/types';
import { InteractiveMount } from '@/components/interactive/interactive-mount';

export function DocBlocks({ blocks }: { readonly blocks: readonly DocumentationBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === 'callout') {
          return (
            <aside className="docs-callout" data-tone={block.tone} key={key}>
              <strong>{block.title}</strong>
              <p style={{ margin: 0 }}>{block.text}</p>
            </aside>
          );
        }
        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul';
          return (
            <ListTag className="docs-list" key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ListTag>
          );
        }
        if (block.type === 'steps') {
          return (
            <ol className="docs-steps" key={key}>
              {block.items.map((item, stepIndex) => (
                <li key={item.title}>
                  <strong>
                    {stepIndex + 1}. {item.title}
                  </strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (block.type === 'table') {
          return (
            <div className="table-wrap" key={key}>
              <table className="docs-table">
                <caption>{block.caption}</caption>
                <thead>
                  <tr>
                    {block.columns.map((column) => (
                      <th key={column} scope="col">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${row[0]}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cellIndex}-${cell}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === 'links') {
          return (
            <div className="docs-links" key={key}>
              {block.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  <strong>{link.label}</strong>
                  <small>{link.description}</small>
                </Link>
              ))}
            </div>
          );
        }
        return <InteractiveMount key={key} component={block.component} />;
      })}
    </>
  );
}
