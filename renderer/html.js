export { renderToHTML, testHTML };

// Escape special characters reserved by HTML
function sanitize(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

function br(n=1) {
    return '<br>'.repeat(n);
}

function open_tag(text, ...attributes) {
    let attr = '';
    for (const a of attributes) {
        attr = attr + ' ' + a.name + ' = \"' + a.value + '\"';
    }
    return '<'+text+attr+'>';
}
function close_tag(text) {
    return '</'+text+'>';
}

function tag(tag_name, content, ...attributes) {
    return open_tag(tag_name, ...attributes)
        + content
        + close_tag(tag_name);
}

/**
 * Returns the appropriate header for the subdivision level, or nothing if the subdivision is too
 * deep. Subdivisions deeper than 5 (corresponding to h6) won't have a title.
 */
function header(level, text, index=[]) {
    if(level > 5)
        return '';
    index = index.map((i)=>i+1).join('.');
    const attr = {
        "name": "data-index",
        "value": index
    }
    return tag(`h${level+1}`, text, attr) + '\n';
}

function renderTitle(document) {
    let subtitle = (document.subtitle !== '') ?
        (tag("info-subtitle", document.subtitle) + br()) :
        ('');
    
    return tag("info-main",
            header(0, document.title)
            + open_tag("hr")
            //+ subtitle
            + tag("info-author", document.author)
            + tag("h2", document.subtitle)
            + tag("p", document.intro)
    );
}

function _renderSubsection(section, max_depth) {
    const depth = section.depth;
    if (depth === 0) {
        return tag("p", section.content);
    }

    const content = section.content.map(
        (child) => _renderSubsection(child, max_depth)
    ).join('\n');

    return header(max_depth - depth + 1, section.title, section.index)
        + tag("p", section.intro) + '\n'
        + content;
}

function renderToHTML(document) {
    document.transform(sanitize);

    const content = document.content.map(
        (child) => _renderSubsection(child, document.depth)
    ).join('\n');

    let info_section = renderTitle(document);

    return info_section + '\n\n'
        + content + '\n';
}

function testHTML() {
    return renderToHTML(test_document);
}

import { Document, Subdivision } from "../document.js";

const test_document = {
    "transform": Document.prototype.transform,
    "depth": 1,
    "title": "<A murmur of approbation>",
    "author": "Paradise Lost",
    "subtitle": "Hook said darkly & laughed",
    "intro": `I have observed correctly, the non-freedom of the boys concluded.
    Testament into one the expressions of his property is invested in the middle
    classes forty years ago!`,
    "content": [
        {
            "transform": Subdivision.prototype.transform,
            "depth": 1,
            "index": [0],
            "title": "They told me he was & will be",
            "intro": `It seemed to be, a savage inhabitant of some chemical
            instruments, which procured me great esteem and value her. A murmur
            of approbation followed Elizabeth's simple & powerful appeal, but it
            was only when I awoke, and allured by the murderer of William, of
            Justine, the murder had been the favourite of yours; and I could
            unravel the mystery of their ruin.`,
            "content": [
                {
                    "transform": Subdivision.prototype.transform,
                    "depth": 0,
                    "index": [0, 0],
                    "content": `No; from that part of the woods. When she again
                    lived, it was wholesome; and they well repaid my labours.
                    Their melancholy is soothing, and their eldest child was
                    thin and very happy, only a little water when I was alive.
                    The blood flowed freely in my countenance betrayed the secret
                    of the towns that I might have produced it, yet I own to you
                    by our mutual happiness`
                }
            ]
        }
    ]
}