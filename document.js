export {Document, Subdivision};

// limits to the size of a paragraph, in sentences
const min_paragraph = 3;
const max_paragraph = 5;

// limits to the length of a subdivision, e.g. how many paragraphs a section should have
const min_sub = 3;
const max_sub = 5;

// limits to the size of a subdivision's introduction, in paragraphs
const min_intro = min_sub;
const max_intro = max_sub;

// max length of a title, in tokens
const max_title = 5;

// Returns a random integer between a and b inclusive
function rand_between(a, b) {
    return Math.round(Math.random() * (b-a)) + a;
}

function generate_title(generator, num_sentences, max_tokens) {
    return generator
        .sentences(num_sentences, max_tokens)
        .replace(/.$/m, '');
}

function generate_author(generator) {
    return generator
        ._random_ngram()
        .join(' ')
        .replace(/[!?,;]/g, '');
}

function generate_paragraph(generator) {
    return generator.sentences(rand_between(min_paragraph, max_paragraph));
}

function generate_intro(generator) {
    return Array.from(
        { length: rand_between(min_intro, max_intro) },
        () => generate_paragraph(generator))
    .join("\n\n");

}

/**
 * A Subdivision is part of a document. It generalises the concepts of chapter, section, subsection
 * and paragraph.
 * 
 * - A subdivision of depth 0 is a paragraph: it has no title and no further subdivisions.
 * - All subdivisions of depth d > 0 have a title and are composed of a certain number
 * of subdivisions of depth d-1.
 * 
 */
class Subdivision {
    constructor(generator, depth, index) {
        this.depth = depth;
        this.index = index;
        this._generate(generator);
    }

    _generate(generator) {
        if (this.depth === 0) {
            this.content = generate_paragraph(generator);
            return;
        }

        this.title = generate_title(generator, 1, max_title);
        this.intro = generate_paragraph(generator);

        this.content = Array.from(
            {length: rand_between(min_sub, max_sub)},
            (_, i) => new Subdivision(generator, this.depth - 1, [...this.index, i])
        );
    }

    transform(callbackfn) {
        if (this.depth === 0) {
            this.content = callbackfn(this.content);
            return;
        }

        this.title = callbackfn(this.title);
        this.intro = callbackfn(this.intro);

        this.content.forEach((sub) => sub.transform(callbackfn));
    }
}

/**
 * A Document has a title, a subtitle (may be left empty) an author and a content.
 * 
 * The content is an array of chapters. Each chapter is a Subdivision of the given depth.
 */
class Document {
    constructor(generator, num_chapters, depth=2) {
        this.title = generate_title(generator, 1, max_title);
        this.subtitle = generate_title(generator, rand_between(0,2), max_title*1.5);
        this.author = generate_author(generator);
        this.depth = depth;

        this._generate(generator, num_chapters);
    }

    _generate(generator, num_chapters) {
        this.intro = generate_intro(generator);

        this.content = Array.from(
            {length: num_chapters},
            (_, i) => new Subdivision(generator, this.depth, [i])
        );
    }

    transform(callbackfn) {
        this.title = callbackfn(this.title);
        this.subtitle = callbackfn(this.subtitle);
        this.author = callbackfn(this.author);
        this.intro = callbackfn(this.intro);

        this.content.forEach((chapter) => chapter.transform(callbackfn));
    }
}