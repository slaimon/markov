export { renderToMarkdown };

/**
 * Generates a header like this one:
 * 
 * ```
 * ### 1.2 The great escape
 * ```
 * 
 * The header has the appropriate number of `#` symbols and is optionally numbered.
 */
function header(level, text, index=undefined) {
    let str_index = '';
    if (index) {
        index = index.map((n) => n+1);
        str_index = index.join('.') + " ";
    }
    
    return "#".repeat(level+1) + " "
            + str_index
            + text + "\n\n";
}

function _renderSubsection(section, max_depth) {
    const depth = section.depth;
    if (depth === 0) {
        return section.content;
    }

    const content = section.content.map(
        (child) => _renderSubsection(child, max_depth)
    ).join("\n\n");

    return header(max_depth - depth + 1, section.title, section.index)
        + section.intro + "\n\n"
        + content;
}

function renderToMarkdown(document) {
    const content = document.content.map(
        (child) => _renderSubsection(child, document.depth)
    ).join("\n\n");
    return header(0, document.title)
        + ((document.subtitle === "") ? ("") : (document.subtitle + "\n\n"))
        + "by " + document.author + "\n\n"
        + header(1, "Foreword")
        + document.intro + "\n\n"
        + content;
}