"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/graphology-utils";
exports.ids = ["vendor-chunks/graphology-utils"];
exports.modules = {

/***/ "(ssr)/./node_modules/graphology-utils/is-graph.js":
/*!***************************************************!*\
  !*** ./node_modules/graphology-utils/is-graph.js ***!
  \***************************************************/
/***/ ((module) => {

eval("/**\n * Graphology isGraph\n * ===================\n *\n * Very simple function aiming at ensuring the given variable is a\n * graphology instance.\n */ /**\n * Checking the value is a graphology instance.\n *\n * @param  {any}     value - Target value.\n * @return {boolean}\n */ \nmodule.exports = function isGraph(value) {\n    return value !== null && typeof value === \"object\" && typeof value.addUndirectedEdgeWithKey === \"function\" && typeof value.dropNode === \"function\" && typeof value.multi === \"boolean\";\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvZ3JhcGhvbG9neS11dGlscy9pcy1ncmFwaC5qcyIsIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0NBTUMsR0FFRDs7Ozs7Q0FLQztBQUNEQSxPQUFPQyxPQUFPLEdBQUcsU0FBU0MsUUFBUUMsS0FBSztJQUNyQyxPQUNFQSxVQUFVLFFBQ1YsT0FBT0EsVUFBVSxZQUNqQixPQUFPQSxNQUFNQyx3QkFBd0IsS0FBSyxjQUMxQyxPQUFPRCxNQUFNRSxRQUFRLEtBQUssY0FDMUIsT0FBT0YsTUFBTUcsS0FBSyxLQUFLO0FBRTNCIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vb3BlbnRhbGVudC8uL25vZGVfbW9kdWxlcy9ncmFwaG9sb2d5LXV0aWxzL2lzLWdyYXBoLmpzPzA3NGQiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHcmFwaG9sb2d5IGlzR3JhcGhcbiAqID09PT09PT09PT09PT09PT09PT1cbiAqXG4gKiBWZXJ5IHNpbXBsZSBmdW5jdGlvbiBhaW1pbmcgYXQgZW5zdXJpbmcgdGhlIGdpdmVuIHZhcmlhYmxlIGlzIGFcbiAqIGdyYXBob2xvZ3kgaW5zdGFuY2UuXG4gKi9cblxuLyoqXG4gKiBDaGVja2luZyB0aGUgdmFsdWUgaXMgYSBncmFwaG9sb2d5IGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSAge2FueX0gICAgIHZhbHVlIC0gVGFyZ2V0IHZhbHVlLlxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0dyYXBoKHZhbHVlKSB7XG4gIHJldHVybiAoXG4gICAgdmFsdWUgIT09IG51bGwgJiZcbiAgICB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmXG4gICAgdHlwZW9mIHZhbHVlLmFkZFVuZGlyZWN0ZWRFZGdlV2l0aEtleSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiB2YWx1ZS5kcm9wTm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIHR5cGVvZiB2YWx1ZS5tdWx0aSA9PT0gJ2Jvb2xlYW4nXG4gICk7XG59O1xuIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJpc0dyYXBoIiwidmFsdWUiLCJhZGRVbmRpcmVjdGVkRWRnZVdpdGhLZXkiLCJkcm9wTm9kZSIsIm11bHRpIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/graphology-utils/is-graph.js\n");

/***/ })

};
;