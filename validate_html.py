from html.parser import HTMLParser
from pathlib import Path

void_tags = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

class TagChecker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in void_tags:
            self.stack.append((tag, self.getpos()))

    def handle_endtag(self, tag):
        if not self.stack:
            self.errors.append((tag, 'unexpected close', self.getpos()))
            return
        last_tag, _ = self.stack[-1]
        if last_tag == tag:
            self.stack.pop()
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                self.errors.append((tag, f'mismatched close, expected </{last_tag}>', self.getpos()))
                self.stack = self.stack[:i]
                return
        self.errors.append((tag, 'unexpected close', self.getpos()))

    def close(self):
        super().close()
        for tag, pos in self.stack:
            self.errors.append((tag, 'unclosed tag', pos))

for path in ['index.html', 'portfolio/index.html']:
    text = Path(path).read_text(encoding='utf-8')
    parser = TagChecker()
    parser.feed(text)
    parser.close()
    print('FILE:', path)
    if parser.errors:
        for tag, msg, pos in parser.errors:
            print(f'  {pos[0]}:{pos[1]} {tag} - {msg}')
    else:
        print('  no tag errors found')
