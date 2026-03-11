# The Book of Sand

This is a webpage that generates new content each time you load it. You won't see the same page
twice! Infinite possibilities... but they're all nonsense. [See it yourself!](https://slaimon.github.io/markov)

There's a Markov-chain generator under the hood, trained on public domain works. Actually, the
training happens each time you load the page; it's just so fast that you'll barely notice.

We don't put up with any of that GPU-intensive LLM stuff around these parts, this kind of generator
is extremely lightweight and completely harmless ;)

## Why?

There are "services" online that gatekeep knowledge by forcing you to upload your own documents in
exchange for theirs. That way, they amass even more knowledge and sell it to AI companies and other
shady actors.

I won't say more, except that you can easily print a webpage to PDF and upload it wherever you
want. Have fun!

## Source structure

- `multimap.js` is a data structure for efficient computation and retrieval of N-gram frequencies.
- `markov.js` implements the Markov-chain generator.
- `document.js` contains a class representing a `Document` that gets auto-generated at
  instantiation time.
- Three different renderers to convert a generated `Document` into text:
  - `renderer/html.js` is used in the actual webpage to generate the HTML code.
  - There's also a renderer for Markdown and one for Latex. For instance, you can take the output
    of `renderToLatex()` and paste it to a file, then use `pdflatex` or what have you to get a
    beautiful (if completely nonsensical) document.
