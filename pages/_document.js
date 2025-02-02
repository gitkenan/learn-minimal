import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body className="antialiased bg-[#1a2b23] relative">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
