// pages/test/test-parser.js
import ParserTest from '../../components/test_pages/ParserTest';

export default function TestParserPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-8 px-6">Markdown Parser Testing</h1>
        <ParserTest />
      </div>
    </div>
  );
}
