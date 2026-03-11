export { renderToLatex, testLatex };

const preamble =
`\\documentclass[a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[parfill, skip=\\the\\baselineskip plus2pt]{parskip}
\\usepackage{setspace}
\n`;

// Deeper subdivision levels are not supported, but seem useless (all of this code is, afterall)
const subdivision_names = [
    "chapter",
    "section",
    "subsection",
    "subsubsection"
]

// Escape special characters reserved by Latex
function sanitize(text) {
    return text
        .replace(/\\/g, "\\textbackslash")
        .replace(/~/g, "\\textasciitilde")
        .replace(/\^/g, "\\textasciicircum")
        .replace(/[&%$#_{}]/g, "\\$&")
}

function br(n=1) {
    return '\n'.repeat(n);
}

function paren(text) {
    return '{'+text+'}';
}

// e.g.: command("begin", "document") -> \begin{document}
function command(command_name, ...params) {
    return '\\' + command_name + params.map(paren).join('');
}

// Add `\begin` and `\end` commands around `content`
function block(block_name, content) {
    return command("begin", block_name) + br()
        + content + br()
        + command("end", block_name);
}

/**
 * Returns the appropriate header for the subdivision level, or nothing if the subdivision is too
 * deep. Subdivisions deeper than subsubsections won't have a title.
 */
function header(level, text) {
    if(level >= subdivision_names.length)
        return '';
    return command(subdivision_names[level], text) + br(2);
}

function renderTitlePage(document) {
    let subtitle = (document.subtitle !== '') ?
        (command("vspace", "3mm") + br()
        + command("large", document.subtitle)
        + "\\\\" + br()) :
        ('');
    
    return block("titlepage",
        block("center",
            paren(
                command("LARGE")
                + command("bfseries") + br()
                + document.title + "\\\\" + br()
                + subtitle
                + command("vspace", "5mm") + br()
                + document.author
            )
        )
    );
}

function renderIntro(document) {
    return block("doublespace", document.intro) + command("cleardoublepage");
}

function _renderSubsection(section, max_depth) {
    const depth = section.depth;
    if (depth === 0) {
        return section.content;
    }

    const content = section.content.map(
        (child) => _renderSubsection(child, max_depth)
    ).join(br(2));

    return header(max_depth - depth, section.title, section.index)
        + section.intro + br(2)
        + content;
}

function renderToLatex(document) {
    document.transform(sanitize);

    const content = document.content.map(
        (child) => _renderSubsection(child, document.depth)
    ).join(br(2));

    const titlepage = renderTitlePage(document);
    const intro = (document.intro === '') ?
        ('') : (renderIntro(document)); 

    return preamble
        + command("begin", "document") + br(2)
        + titlepage + br(2)
        + intro + br(2)
        + command("tableofcontents") + br(2)
        + content + br(2)
        + command("end", "document") + br();
}

function testLatex() {
    return renderToLatex(test_document);
}

import { Document, Subdivision } from "../document.js";

const test_document = {
            "transform": Document.prototype.transform,
            "depth": 1,
            "title": "{BLCK--PRD}",
            "author": "%$ MCR $%",
            "subtitle": "",
            "intro": `\\ When I was \\ a young boy ^.^ \\ My father __ took me into
            the city __ to see a marching band`,
            "content": [
                {
                    "transform": Subdivision.prototype.transform,
                    "depth": 1,
                    "title": "He said",
                    "intro": `Son when {{you grow up}} would you be ### the saviour of
                    the broken $$$ the beaten & the damned ~~~`,
                    "content": [
                        {
                            "transform": Subdivision.prototype.transform,
                            "depth": 0,
                            "content": `Because one day %% I'll leave you %% a phantom
                            %% to lead you in the summer, to join the black parade...`
                        }
                    ]
                }
            ]
        }