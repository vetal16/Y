/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Dvornik Sergey (sdvornik@yahoo.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Image recognition demo module.
 * @author Sergey Dvornik(sdvornik@yahoo.com)
 * @version 1.0.1
 */
(function(document, undefined) {
    var rootNodeLineArr = [];
    var startLineArr = [];
    var MAX_PIXEL_NODE_CONTENT = 5,
        NODE_QUANTITY_THRESHOLD = 0.3,
        Colors = ["#DCDCDC", "#FFE4C4", "#FFDAB9", "#FFF8DC", "#E6E6FA", "#FFE4E1", "#708090", "#191970",
        "#6495ED", "#483D8B", "#4682B4", "#00CED1", "#00FFFF", "#006400", "#556B2F", "#98FB98", "#BDB76B",
        "#FFFF00", "#FFD700", "#CD853F", "#F4A460", "#FA8072", "#FFA500", "#F08080", "#FF1493", "#FF00FF",
        "#C1CDC1", "#7FFFD4", "#00FF7F", "#458B00", "#FF8247", "#FFA54F", "#7A378B", "#90EE90"],

        ordinarySort = function(a,b){return a-b;};

    document.addEventListener("DOMContentLoaded", function(){
        var inputElement = document.getElementById("input");
        inputElement.addEventListener("change", readFile, false);
    });

    function readFile(e) {
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (event) {
            createImage(event.target.result);
        };
        reader.readAsArrayBuffer(file);
    }

    function createImage(buffer) {
        var bitmap = getBitmap(buffer),
            canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            body = document.getElementsByTagName("body")[0];
        body.appendChild(canvas);
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        drawNewImage(bitmap, ctx);
    }

    function getBitmap(buffer) {
        var dataView = new DataView(buffer),
            bitmap = {},
            offset = dataView.getUint32(10, true),
            bitCount = dataView.getUint16(28, true);

        bitmap.width = dataView.getUint32(18, true);
        bitmap.height = dataView.getUint32(22, true);
        bitmap.stride = Math.floor((bitCount * bitmap.width + 31) / 32) * 4;
        bitmap.data = new Uint8Array(buffer, offset);
        return bitmap;
    }

    function drawNewImage(bitmap, gCtx) {

        var imgWidth = bitmap.width, imgHeight = bitmap.height;

        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            imgData = ctx.createImageData(imgWidth, imgHeight);
        for (let y = 1; y <= imgHeight; ++y) {
            for (let x = 0; x < imgWidth; ++x) {
                let i = 4 * (y - 1) * imgWidth + 4 * x;
                let k = 3 * x + bitmap.stride * (imgHeight - y);

                imgData.data[i] = bitmap.data[k + 2];
                imgData.data[i + 1] = bitmap.data[k + 1];
                imgData.data[i + 2] = bitmap.data[k];
                imgData.data[i + 3] = 255;
            }
        }
        imgData = convertImageDataToBinaryWithColorFilter(imgData);
        drawModifiedImage(imgData, gCtx);

    }

    function convertImageDataToBinaryWithColorFilter(/*ImageData*/ imgData) {
        var y, x, i;
        var red, green, blue, avg;
        for (y = 0; y < imgData.height; ++y) {
            for (x = 0; x < imgData.width; ++x) {
                i = 4 * y * imgData.width + 4 * x;

                red = imgData.data[i];
                blue = imgData.data[i + 1];
                green = imgData.data[i + 2];

                if ((red > 30 && red < 230 && blue > 80 && blue < 240 && green > 110 && green < 250) ||
                    red < 60 && blue < 60 && green < 60) avg = 0;
                else avg = 255;

                imgData.data[i] = avg;
                imgData.data[i + 1] = avg;
                imgData.data[i + 2] = avg;
            }
        }
        return imgData;
    }


    function drawModifiedImage(/*ImageData*/ imgData, /*CanvasRenderingContext2D*/ gCtx) {

        Array.prototype.min = function(){
            var length = this.length,
                min = this[length-1], el;
            for(let i = length-2; i>=0; i--){
                el = this[i];
                if(el < min){
                    min = el;
                }
            }
            return min;
        };

        Array.prototype.max = function(){
            var length = this.length,
                max = this[length-1], el;
            for(let i = length-2; i>=0; i--){
                el = this[i];
                if(el>max){
                    max = el;
                }
            }
            return max;
        };

        Array.prototype.pushAll = function(arr) {
            var length = arr.length;
            for(let k = 0; k < length; ++k) {
                this.push(arr[k]);
            }
        };

        Uint32Array.prototype.getIndexByElm = function(elm) {
            for(let i = 0; i < this.length; ++i) {
                if(elm==this[i]) return i;
            }
            return null;
        };

        Uint32Array.prototype.createVocabulary = function() {
            var /*Map.<Number, Number>*/ vocabularyNumberByKey = new Map();
            this.forEach(function(elm,index) {
                vocabularyNumberByKey.set(elm, index);
            });
            return vocabularyNumberByKey;
        };

        function getArrayFromVocabulary(/*Array.<Number>*/ arrayOfNumber, /*Uint32Array*/ content) {
            var /*Uint32Array*/ connectedVerticesIdArr = new Uint32Array(arrayOfNumber.length);
            arrayOfNumber.forEach( function(indexOfContent, index) {
                connectedVerticesIdArr[index] = content[indexOfContent];
            });
            return connectedVerticesIdArr;
        }

        Set.prototype.addAllSet = function(/*Set*/ addedSet) {
            var arr = Array.from(addedSet);
            for(let i = 0; i < arr.length; ++i) {
                this.add(arr[i]);
            }
        };

        Set.prototype.addAll = function(addedArray) {
            for(let i = 0; i < addedArray.length; ++i) {
                this.add(addedArray[i]);
            }
        };

        var /*Map.<Number, Uint32Array>*/ pointMap = new Map(),
        /*Map.<Number, Boolean>*/ pointMapUsed = new Map(),
        /*Array.<GenerationNode>*/ rootNodeArr = [],
        /*Map.<Number, FreeEndTuple>*/ freeEndTupleMap = new Map(),
        /*Array.<FreeEndTuple>*/ freeEndTupleStack = [],
        /*Array.<GenerationNode>*/ excludedRootNodeArr = [],
        /*Array.<GenerationNode>*/ endNodeArr = [];

        //TODO
        var /*Set.<GenerationNode>*/ allCreatedNodes = new Set();

        function NextGenerationTuple(/*Uint32Array*/ fst,
                                     /*Uint32Array*/ snd,
                                     /*Array.<Number>*/ rPoint,
                                     /*Array<Number>*/ lPoint) {
            this.nextGeneration = fst;
            this.prevGeneration = snd;
            this.lPoint = lPoint;
            this.rPoint = rPoint;
        }

        function FreeEndTuple(/*GenerationNode*/ node,
                              /*Uint32Array*/ endContent,
                              /*Uint32Array*/ startContent,
                              /*Array.<Number>*/ rPoint,
                              /*Array.<Number>*/ lPoint) {
            this.node = node;
            this.freeEndContent = endContent;
            this.firstElementOfNodeContent = startContent;
            this.rPoint = rPoint;
            this.lPoint = lPoint;
        }

        function GenerationNode(/*GenerationNode*/ node, /*Uint32Array*/ content, /*Array*/ rPoint, /*Array*/ lPoint) {
            this.parentNodes = /*Array.<GenerationNode>*/ [];
            this.startContents = /*Array.<Uint32Array>*/ [];
            this.childNodes = /*Array.<GenerationNode>*/ [];
            this.lastContent = /*Uint32Array*/ [];
            this.lContent = /*Array.<Number>*/ [];
            this.rContent = /*Array.<Number>*/ [];
            if(node == null) {
                this.isRoot = true;
                this.rootNodeLine = content;
                this.charge = null;
                this.nullChargeNodeList = [];
            }
            else {
                this.isRoot = false;
                this.parentNodes.push(node);
                this.charge = node.charge;
                this.startContents.push(content);
                this.rContent.pushAll(rPoint);
                this.lContent.pushAll(lPoint);
            }


            allCreatedNodes.add(this);
        }
        var nodeCounter = 0;
        GenerationNode.prototype = {
            constructor: /*GenerationNode*/ GenerationNode,

            addContent: function (/*Uint32Array*/ content, /*Array*/ rContent, /*Array*/ lContent) {
                this.lastContent=content;
                this.rContent.pushAll(rContent);
                this.lContent.pushAll(lContent);
            },
            addParent: function (/*GenerationNode*/ node, /*Uint32Array*/ startContent) {
                this.parentNodes.push(node);
                this.startContents.push(startContent);
            },
            getLastContent: function () {
                return this.lastContent;
            },

            setCharge: function(/*Boolean*/ charge) {
                if(this.charge !== null) {
                    console.log("Previous charge "+(this.charge===charge));
                }//throw "Attempt to change charge";

                this.charge = charge;

            }
        };

        function getRootNode(/*GenerationNode*/ node) {
            if (node.isRoot == true) {
                return node;
            }
            else {
                let /*GenerationNode*/ nextNode = node.parentNodes[0];
                return getRootNode(nextNode);
            }
        }

        function getKey(/*Number*/ x, /*Number*/ y) {
            return (x << 16) | y;
        }

        function getX(/*Number*/ key) {
            return key >> 16;
        }

        function getY(/*Number*/ key) {
            return key & 0xFFFF
        }

        function Vector(/*Number*/ x, /*Number*/ y){
            this.x = x;
            this.y = y;
        }

        function getVector(/*Number*/ keyStart, /*Number*/ keyEnd) {
            return new Vector(getX(keyEnd) - getX(keyStart), getY(keyEnd) - getY(keyStart));
        }

        function isPseudoScalarPositive(/*Vector*/ v1, /*Vector*/ v2) {
            return (v1.x*v2.y-v1.y*v2.x) > 0;
        }

        function isScalarZero(/*Vector*/ v1, /*Vector*/ v2) {
            return (v1.x*v2.x+v1.y*v2.y) == 0;
        }

        function getDistanceBetweenKeys(/*Number*/ key1, /*Number*/ key2) {
            var x = getX(key1) - getX(key2),
                y = getY(key1) - getY(key2);
            return x * x + y * y;
        }

        function getSquareDistanceFromPointToSegment(/*Number*/ key, /*Number*/ key1, /*Number*/ key2) {
            var x = getX(key1),
                y = getY(key1),
                deltaX = getX(key2) - x,
                deltaY = getY(key2) - y;

            if (deltaX !== 0 || deltaY !== 0) {
                let delta = ((getX(key) - x) * deltaX + (getY(key) - y) * deltaY) / (deltaX * deltaX + deltaY * deltaY);
                if (delta > 1) {
                    x = getX(key);
                    y = getY(key2);
                }
                else if (delta > 0) {
                    x += deltaX * delta;
                    y += deltaY * delta;
                }
            }
            deltaX = getX(key) - x;
            deltaY = getY(key) - y;

            return deltaX * deltaX + deltaY * deltaY;
        }

        function simplifyRadialDistance(/*Array*/ points, /*Number*/ tolerance) {

            var /*Number*/ prevPoint = points[0],
            /*Array*/ newPoints = [prevPoint],
            /*Number*/ point;

            for (let i = 1, len = points.length; i < len; i++) {
                point = points[i];
                if (getDistanceBetweenKeys(point, prevPoint) > tolerance) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }
            if (prevPoint !== point) {
                newPoints.push(point);
            }
            return new Uint32Array(newPoints);
        }

        function simplifyDPStep(/*Uint32Array*/ points, /*Number*/ first, /*Number*/ last, /*Number*/ squareTolerance, /*Array*/ simplified) {
            var maxSquareDistance = squareTolerance,
                index;

            for (let i = first + 1; i < last; i++) {
                let squareDistance = getSquareDistanceFromPointToSegment(points[i], points[first], points[last]);

                if (squareDistance > maxSquareDistance) {
                    index = i;
                    maxSquareDistance = squareDistance;
                }
            }
            if (maxSquareDistance > squareTolerance) {
                if (index - first > 1) {
                    simplifyDPStep(points, first, index, squareTolerance, simplified);
                }
                simplified.push(points[index]);
                if (last - index > 1) {
                    simplifyDPStep(points, index, last, squareTolerance, simplified);
                }
            }
        }

        // simplification using Ramer-Douglas-Peucker algorithm
        function simplifyDP(/*Uint32Array*/ points, /*Number*/ sqTolerance) {
            var last = points.length - 1,
                simplified = [points[0]];
            simplifyDPStep(points, 0, last, sqTolerance, simplified);
            simplified.push(points[last]);
            return new Uint32Array(simplified);
        }

        // combine algorythms for better performance
        function simplify(/*Uint32Array*/ points, /*Number*/ tolerance, /*Boolean*/ highestQuality) {
            if (points.length <= 2) return points;
            var squareTolerance = tolerance * tolerance;
            points = highestQuality ? points : simplifyRadialDistance(points, squareTolerance);
            points = simplifyDP(points, squareTolerance);
            return points;
        }

        function createPointMap(imgData) {
            var imgDataSize = 4 * imgData.width * imgData.height;
            for (let x = 0; x < imgData.width; ++x) {
                for (let y = 0; y < imgData.height; ++y) {
                    let i = 4 * imgData.width * y + 4 * x;
                    if (imgData.data[i] == 0) {
                        let pointKeyArr = getNeighbors(x, y, imgData, imgDataSize);
                        //remove element if it's isolated black pixel
                        if (pointKeyArr.length == 0) {
                            continue;
                        }
                        pointMap.set(getKey(x, y), new Uint32Array(pointKeyArr));
                        pointMapUsed.set(getKey(x, y), false);
                    }
                }
            }
        }

        function getNeighbors(/*Number*/ x, /*Number*/ y, /*ImageData*/ imgData, /*Number*/ imgDataSize) {
            var pointKeyArr = [];
            for (let dy = -1; dy <= 1; ++dy) {
                for (let dx = -1; dx <= 1; ++dx) {
                    if (dx == 0 && dy == 0) continue;

                    let i = 4 * imgData.width * (y + dy) + 4 * (x + dx);
                    if (i < 0 || i >= imgDataSize) continue;
                    if (imgData.data[i] == 0) {
                        pointKeyArr.push(getKey(x + dx, y + dy));
                    }
                }
            }
            return pointKeyArr;
        }

        function createAllNodeTree() {

            function clearMarkedContent(arrayOfPointKey) {
                arrayOfPointKey.forEach(function(item) {
                    pointMapUsed.set(item, false);
                });
            }
            pointMap.forEach(function(value, pointMapKey) {
                if (pointMapUsed.get(pointMapKey)) return;
                let /*Array.<Number>*/ rawRootNodeContent = [],
                /*Array.<NextGenerationTuple>*/ arrayOfNextGenerationTuple =
                    searchFirstSplitForRootNode(pointMapKey, rawRootNodeContent);

                // traversed all node content but don't find split
                if (arrayOfNextGenerationTuple == null) {
                    // if size of node smaller then threshold size stop node processing
                    if (rawRootNodeContent.length < MAX_PIXEL_NODE_CONTENT) return;
                    arrayOfNextGenerationTuple = rebuildNode(rawRootNodeContent);
                    // if rebuilding of node was unsuccessful continue loop
                    if (arrayOfNextGenerationTuple == null) return;
                }

                // clear marked point
                clearMarkedContent(rawRootNodeContent);
                arrayOfNextGenerationTuple.forEach(function(item){
                    clearMarkedContent(item.nextGeneration);
                });


                let rootNodeLine = null;
                let arrayOfNextGenerationTupleOfRootNodeLine;
                for(let i = 0; i < arrayOfNextGenerationTuple.length; ++i) {
                    let testLine = arrayOfNextGenerationTuple[i].nextGeneration;
                    arrayOfNextGenerationTupleOfRootNodeLine =
                        searchNextGenerationNeighbors(testLine, null);
                    if(arrayOfNextGenerationTupleOfRootNodeLine!=null && arrayOfNextGenerationTupleOfRootNodeLine.length > 1) {
                        rootNodeLine = testLine;
                        break;
                    }
                    clearMarkedContent(testLine);
                }
                // create root node
                let /*GenerationNode*/ rootNode;
                if(rootNodeLine == null) {
                    console.log("Can't create rootNodeLine");
                    return;
                }
                else {
                    rootNode = new GenerationNode(null, rootNodeLine);
                }

                // save reference
                rootNodeArr.push(rootNode);
                saveMultiEndNode(rootNode, arrayOfNextGenerationTupleOfRootNodeLine);
                processFreeEndTupleStack();
            });

            function saveMultiEndNode(/*GenerationNode*/ node,
                                      /*Array.<NextGenerationTuple>*/arrayOfNextGenerationTuple) {

                arrayOfNextGenerationTuple.forEach(function(item) {
                    let freeEndTuple = new FreeEndTuple(
                        node,
                        item.prevGeneration,
                        item.nextGeneration,
                        item.rPoint,
                        item.lPoint
                    );
                    // use free point as key for FreeEndTuple object
                    // push FreeEndTuple in stack
                    item.nextGeneration.forEach(function(item) {
                        pointMapUsed.set(item, false);
                        freeEndTupleMap.set(item, freeEndTuple);
                    });
                    freeEndTupleStack.push(freeEndTuple);
                });
            }

            function saveFinalEndNode(/*GenerationNode*/ newNode) {
                endNodeArr.push(newNode);
            }

            function processFreeEndTupleStack() {

                var /*FreeEndTuple*/ freeEndTuple = freeEndTupleStack.pop();
                // stack empty
                if (freeEndTuple == undefined) return;
                var parentNode = freeEndTuple.node,
                    rootNodeLine = parentNode.rootNodeLine,
                    startLine = freeEndTuple.firstElementOfNodeContent;

                // try to define charge of root node
                if(parentNode.isRoot) {
                    let /*Map.<Number, Array.<Number>>*/ connectionsMap = createConnectionsMap(rootNodeLine, startLine);
                    let charge = null;
                    rootNodeLine.forEach(function(item, index){
                        let neighbors = connectionsMap.get(index);

                        if(neighbors !== undefined && neighbors.length > 1) {
                            neighbors.sort(ordinarySort);
                            // check order of array with the help of pseudoscalar multiplication
                            let v1 = getVector(rootNodeLine[index], startLine[neighbors[0]]);
                            let v2 = getVector(startLine[neighbors[0]], startLine[neighbors[1]]);
                            let sign = isPseudoScalarPositive(v1, v2);
                            if(charge === null) charge = sign;
                            else if(charge != sign) {
                                rootNodeLineArr.push(rootNodeLine);
                                startLineArr.push(startLine);
                                console.log("ERROR");
                                console.log(rootNodeLine);
                                console.log(startLine);
                            }
                        }
                    });
                    if(charge === null) {
                        parentNode.nullChargeNodeList.push(parentNode);
                    }
                    else if(parentNode.charge === null){
                        parentNode.setCharge(charge);
                    }
                }

                var newNode = new GenerationNode(   parentNode,
                                                    startLine,
                                                    freeEndTuple.rPoint,
                                                    freeEndTuple.lPoint);
                if(newNode.charge === null) {
                    getRootNode(newNode).nullChargeNodeList.push(newNode);
                }

                freeEndTuple.firstElementOfNodeContent.forEach(function(pointKey){
                    freeEndTupleMap.delete(pointKey);
                });

                var prevGeneration = freeEndTuple.firstElementOfNodeContent;
                var /*Array.<NextGenerationTuple>*/ arrayOfTuple =
                    searchNextGenerationNeighbors(prevGeneration, freeEndTuple.node);

                while (true) {

                    if (arrayOfTuple != null && arrayOfTuple.length == 1) {
                        // standard case
                        newNode.addContent(arrayOfTuple[0].nextGeneration, arrayOfTuple[0].rPoint, arrayOfTuple[0].lPoint);
                        prevGeneration = arrayOfTuple[0].nextGeneration;
                        arrayOfTuple = searchNextGenerationNeighbors(prevGeneration, newNode);
                        continue;
                    }

                    if (arrayOfTuple == null) {
                        // find end element
                        let /*Uint32Array*/ lastContent = newNode.getLastContent();

                        let /*FreeEndTuple*/ connectedFreeEndTuple = null;
                        for (let i = 0; i < lastContent.length; ++i) {
                            connectedFreeEndTuple = freeEndTupleMap.get(lastContent[i]);
                            if (connectedFreeEndTuple) break;
                        }
                        if (connectedFreeEndTuple) {
                            // connect nodes
                            setNodeAsParentOfFreeNodeEnd(newNode, connectedFreeEndTuple);
                        }
                        else {
                            // save node as free end node
                            saveFinalEndNode(newNode);
                        }
                        break;
                    }
                    else {
                        // split
                        saveMultiEndNode(newNode, arrayOfTuple);
                        break;
                    }
                }
                // continue stack processing
                processFreeEndTupleStack();
            }
        }

        function searchFirstSplitForRootNode(/*Number*/ pointMapKey, /*Array.<Number>*/ rawRootNodeContent) {

            function searchFirstSplitRecursively(/*Uint32Array*/ content, /*Array.<Number>*/ rawRootNodeContent) {

                var /*Array.<NextGenerationTuple>*/ arrayOfTuple = searchNextGenerationNeighbors(content, true);
                if (arrayOfTuple != null && arrayOfTuple.length == 1) {
                    // standard case
                    let nextGeneration = arrayOfTuple[0].nextGeneration;
                    rawRootNodeContent.pushAll(nextGeneration);
                    return searchFirstSplitRecursively(arrayOfTuple[0].nextGeneration, rawRootNodeContent);
                }
                else {
                    // split
                    return arrayOfTuple;
                }
            }

            var /*Uint32Array*/ initialRootContent = new Uint32Array(1);
            initialRootContent[0] = pointMapKey;
            rawRootNodeContent.push(pointMapKey);
            return searchFirstSplitRecursively(initialRootContent, rawRootNodeContent);
        }

        function rebuildNode(/*Array.<Number>*/ rawRootNodeContent) {
            var square = getContentSquare(rawRootNodeContent),
                contentLength = rawRootNodeContent.length,
                threshold = contentLength / square;
            // if node - line
            if (threshold < NODE_QUANTITY_THRESHOLD) {
                rawRootNodeContent.forEach(function(item) {
                    pointMapUsed.set(item, false);
                });
                // choose center element
                let pointMapKeyIndex = Math.floor(rawRootNodeContent.length / 2);
                let startContent = rawRootNodeContent[pointMapKeyIndex];

                rawRootNodeContent.splice(0, rawRootNodeContent.length);

                let arrayOfNextGenerationTuple =
                    searchFirstSplitForRootNode(startContent, rawRootNodeContent);
                if (arrayOfNextGenerationTuple == null) {
                    console.log("Can't build root node.");
                    return null;
                }
                else {
                    return arrayOfNextGenerationTuple;
                }
            }
            else {
                console.log("NODE_QUANTITY_THRESHOLD exceeded: " + threshold);
                return null;
            }
        }

        function setNodeAsParentOfFreeNodeEnd(/*GenerationNode*/ newNode, /*FreeEndTuple*/ connectedFreeEndTuple) {
            // remove free end from map
            let nextGenerationPointKeyArr = connectedFreeEndTuple.firstElementOfNodeContent;
            for (let i = 0; i < nextGenerationPointKeyArr.length; ++i) {
                freeEndTupleMap.delete(nextGenerationPointKeyArr[i]);
            }
            // find index in stack
            let index;
            for (index = 0; index < freeEndTupleStack.length; ++index) {
                if (connectedFreeEndTuple == freeEndTupleStack[index]) {
                    break;
                }
            }
            // remove end from stack
            freeEndTupleStack.splice(index, 1);
            // get node
            let /*GenerationNode*/ node = connectedFreeEndTuple.node;

            // get content
            let /*Uint32Array*/ startContent = connectedFreeEndTuple.freeEndContent;

            if (getRootNode(newNode) != getRootNode(node)) {
                // save node in array
                excludedRootNodeArr.push(node);
                let index;
                for (index = 0; index < rootNodeArr.length; ++index) {
                    if (rootNodeArr[index] == node) break;
                }
                rootNodeArr.splice(index, 1);
            }
            // add current node in parents array
            node.addParent(newNode, startContent);

        }

        function getAverageContent(/*Array*/ content) {
            var accX = 0, accY = 0;
            for (let i = 0; i < content.length; ++i) {
                accX += getX(content[i]);
                accY += getY(content[i]);
            }
            accX = Math.round(accX / content.length);
            accY = Math.round(accY / content.length);
            return getKey(accX, accY);
        }

        function GlobalGraphTraversing(/*GenerationNode*/ generationNode, /*function*/ processCurrentNode) {

            function processChildNodes(/*GenerationNode*/ node, /*function*/processCurrentNode) {
                for (let i = 0; i < node.childNodes.length; ++i) {
                    let curNode = node.childNodes[i];
                    processCurrentNode(curNode);
                }
            }

            processChildNodes(generationNode, processCurrentNode);
            for (let childNodeKey = 0; childNodeKey < generationNode.childNodes.length; ++childNodeKey) {
                GlobalGraphTraversing(generationNode.childNodes[childNodeKey], processCurrentNode);
            }
        }

        function createConnectionsMap(/*Uint32Array*/ prev, /*Uint32Array*/ orderedNext) {
            var nextPointMap = orderedNext.createVocabulary();

            // Map: index of prev -> array of indexes of next array, that connected with prev array
            var /*Map.<Number, Array.<Number>>*/ connectionsMap = new Map();
            // traverse prev
            prev.forEach(function(pointKey,i) {
                let /*Uint32Array*/ neighbors = pointMap.get(pointKey);
                // traverse array of neighbors
                neighbors.forEach( function(neighbor) {
                    // if nextPointSet contains neighbor
                    let indexOfNextPoint = nextPointMap.get(neighbor);
                    if (indexOfNextPoint != undefined) {
                        let pointArray = connectionsMap.get(i);
                        if (pointArray == undefined) {
                            pointArray = [];
                            connectionsMap.set(i, pointArray);
                        }
                        pointArray.push(indexOfNextPoint);
                    }
                });
            });
            return connectionsMap;
        }

        function createLocalNeighborsMap(/*Uint32Array*/ arrayOfPointKey) {
            var /*Map.<Number, Number>*/ nextGenVocabulary = arrayOfPointKey.createVocabulary(),
                /*Array.<Array>*/ neighborsMap = [];
            arrayOfPointKey.forEach(function(elm, index) {
                neighborsMap[index] = [];
                // find all neighbors
                let neighborsKey = pointMap.get(elm);
                neighborsKey.forEach(function(elm){
                    // find all neighbors points, which next generation included
                    let numberForAdd = nextGenVocabulary.get(elm);
                    if (numberForAdd != undefined) {
                        // if we find it, save it
                        neighborsMap[index].push(numberForAdd);
                    }
                });
            });
            return neighborsMap;
        }

        function checkArraysOrder(/*Uint32Array*/ prev, /*Array.<Uint32Array>*/ arrayOfNextArrays, /*GenerationNode*/ node) {
            function compareArray(minArray, maxArray) {
                var minOfMinArray = minArray.min();
                var maxOfMinArray = minArray.max();
                var minOfMaxArray = maxArray.min();
                var maxOfMaxArray = maxArray.max();
                if(maxOfMaxArray > maxOfMinArray ||
                    minOfMinArray < minOfMaxArray) return true;
                if(minOfMaxArray < minOfMinArray ||
                    maxOfMaxArray < maxOfMinArray) return false;
                return null;
            }
            var result = [];
            var lastPrevIndex = 0;
            arrayOfNextArrays.forEach(function(orderedNext, index) {
                // Map: index of prev -> indexes of next, which connected to prev elements
                let connectionsMap = createConnectionsMap(prev, orderedNext),
                    prevConnectedArrayOfNumber = Array.from(connectionsMap.keys());
                //TODO remove
                if(prevConnectedArrayOfNumber.length == 0) {
                    console.log("unknown error");
                    return;
                }

                let prevConnectedArrayOfPointKey = getArrayFromVocabulary(prevConnectedArrayOfNumber, prev);

                if (orderedNext.length > 1) {
                    let minArray = null;
                    let maxArray = null;
                    for (let i = 0; i < prevConnectedArrayOfNumber.length; ++i) {
                        let prevIndex = prevConnectedArrayOfNumber[i];
                        let nextPointIndexes = connectionsMap.get(prevIndex);

                        if (nextPointIndexes.length > 0) {
                            nextPointIndexes.sort(ordinarySort);
                            if(minArray === null) minArray = nextPointIndexes;
                            maxArray = nextPointIndexes;
                        }
                    }
                    let sign = compareArray(minArray, maxArray);
                    if(sign === null && node !== null) {
                        // maybe previous array length equals 1
                        if(prevConnectedArrayOfPointKey.length == 1){
                            // check order of array with the help of pseudoscalar multiplication
                            let v1 = getVector(prevConnectedArrayOfPointKey[0], orderedNext[minArray[0]]);
                            let v2 = getVector(orderedNext[minArray[0]], orderedNext[minArray[1]]);
                            sign = isPseudoScalarPositive(v1, v2);
                            if(node.charge === null) {
                                //node.setCharge(sign);
                                getRootNode(node).nullChargeNodeList.forEach(function(item, index) {
                                    item.setCharge(sign);
                                });
                                getRootNode(node).nullChargeNodeList = [];
                            }
                            sign = node.charge == sign;

                        }
                        // case 2 -> 2
                        else if(prevConnectedArrayOfPointKey.length == 2 && orderedNext.length == 2) {
                            let v1 = getVector(prevConnectedArrayOfPointKey[0], orderedNext[0]);
                            sign = v1.x == 0 || v1.y == 0;
                        }
                        else {
                            console.log("Unexpected error");
                        }
                    }
                    if (sign === false) {
                        orderedNext.reverse();
                    }
                }

                let rPointArray = [];
                let lPointArray = [];

                // push in rPoint all elements of prev, which not connected to elements of next
                for(let k = lastPrevIndex+1; k <= prevConnectedArrayOfNumber[0]; ++k) {
                    rPointArray.push(prev[k]);
                }
                //  push in rPoint start point of next array
                rPointArray.push(orderedNext[0]);

                // If the last index of array next is less than the last index of the array prev
                if(prevConnectedArrayOfNumber[prevConnectedArrayOfNumber.length - 1] < prev.length - 1) {
                    // if current split element is last
                    if(index == arrayOfNextArrays.length - 1) {

                        // push in lPoint all previous point from prev array, which not connected to elemets of next
                        for(let k = prev.length - 2; k >= prevConnectedArrayOfNumber[prevConnectedArrayOfNumber.length - 1]; --k ) {
                            lPointArray.push(prev[k]);
                        }
                    }
                    else {
                        lPointArray.push(prev[prevConnectedArrayOfNumber[prevConnectedArrayOfNumber.length - 1]]);
                    }
                }
                lPointArray.push(orderedNext[orderedNext.length-1]);
                lastPrevIndex = prevConnectedArrayOfNumber[prevConnectedArrayOfNumber.length - 1];
                let /*NextGenerationTuple*/ resultElm =
                    new NextGenerationTuple(
                        orderedNext,
                        prevConnectedArrayOfPointKey,
                        rPointArray,
                        lPointArray);
                result.push(resultElm);
            });

            return result;
        }

        function searchNextGenerationNeighbors(/*Uint32Array*/ content, /*GenerationNode*/ node) {

            function getNextGenerationArray(content) {
                var /*Set.<Number>*/ nextGenerationSet = new Set();

                content.forEach(function(pointKey){
                    pointMapUsed.set(pointKey, true);
                    let /*Uint32Array*/ neighbors = pointMap.get(pointKey);
                    nextGenerationSet.addAll(neighbors);
                });
                var nextGenArrayOfPointKey = Array.from(nextGenerationSet).filter(function(pointKey) {
                    return !pointMapUsed.get(pointKey);
                });
                return new Uint32Array(nextGenArrayOfPointKey);
            }

            function neighborsBWGraphTraversing(/*Number*/ vertexNumber,
                                                /*Uint8Array*/ used,
                                                /*Array.<Array>*/ neighborsMap) {

                var /*Array.<Number>*/ queue = [],
                /*Number*/ queueHead = 0;
                 queue.push(vertexNumber);
                used[vertexNumber] = 1;
                while (queueHead < queue.length) {
                    vertexNumber = queue[queueHead++];
                    let neighbors = neighborsMap[vertexNumber];
                    neighbors.forEach(function(curVertexNumber) {
                        if (used[curVertexNumber] == 0) {
                            used[curVertexNumber] = 1;
                            queue.push(curVertexNumber);
                        }
                    });
                }
                return queue;
            }

            function getMaxPath(pathStorage) {
                var maxLength = 0,
                    paths;
                pathStorage.forEach(function(pathElm) {
                    var pathLength = pathElm.length;
                    if(pathLength < maxLength) return;
                    if (pathLength > maxLength) {
                        paths = [];
                        maxLength = pathLength;
                    }
                    paths.push(pathElm);
                });
                return paths;
            }

            function neighborsDFSGraphTraversingSimple(/*Number*/ startVertex, /*Array.<Array>*/ neighborsMap) {

                // search the longest path from index 0 to index neighborsMap.length - 1
                var /*Array.<StackElement>*/ stack = [],
                    /*Array.<Array.<Number>>*/ pathStorage = [];

                function StackElement(/*Number*/ vertexNumber, /*Array.<Number>*/ currentPath) {
                    this.vertexNumber = vertexNumber;
                    this.currentPath = currentPath;
                }

                function processStack() {
                    var /*StackElement*/ elm = stack.pop();
                    // if stack is empty
                    if (elm == undefined) return;
                    var /*Array.<Number>*/ path = elm.currentPath,
                        /*Set.<Number>*/ pathSet = new Set(path),
                        /*Number*/ vertex = elm.vertexNumber,
                        /*Array.<Number>*/ neighbors = neighborsMap[vertex],
                        /*Number*/ startStackSize = stack.length;

                    neighbors.forEach(function(item) {
                        // check that current vertex on path
                        if (pathSet.has(item)) return;
                        // copy path array
                        let newPath = path.slice(0);
                        newPath.push(item);
                        let /*StackElement*/ elm = new StackElement(item, newPath);
                        stack.push(elm);
                    });

                    // if nothing push in stack, path ended
                    if (stack.length == startStackSize) {
                        pathStorage.push(path);
                    }
                    processStack();
                }

                var /*Array.<Number>*/ neighbors = neighborsMap[startVertex];
                if(neighborsMap.length == 1) {
                    let path = [];
                    path.push(startVertex);
                    let paths = [];
                    paths.push(path);
                    return paths;
                }
                // init stack
                neighbors.forEach(function(item) {
                    let path = [];
                    path.push(startVertex);
                    path.push(item);
                    let /*StackElement*/ elm = new StackElement(item, path);
                    stack.push(elm);
                });
                processStack();
                return getMaxPath(pathStorage);
            }

            function neighborsDFSGraphTraversingComplex(/*Array.<Number>*/ connectedVerticesNumberArr,
                                                        /*Array.<Array>*/ neighborsMap) {
                var /*Array.<Array.<Number>>*/ arrOfOrderedConnectedVerticesNumberArr,
                /*Array.<Array.<Number>>*/ pathAcc = [];

                if (connectedVerticesNumberArr.length == 1) {
                    return connectedVerticesNumberArr;
                }

                for (let index = 0; index < connectedVerticesNumberArr.length; ++index) {
                    let startVertex = connectedVerticesNumberArr[index];
                    arrOfOrderedConnectedVerticesNumberArr = neighborsDFSGraphTraversingSimple(startVertex, neighborsMap);

                    // if path is single
                    if (arrOfOrderedConnectedVerticesNumberArr.length == 1 &&
                        // and length of path is equal the length of source array
                        arrOfOrderedConnectedVerticesNumberArr[0].length == connectedVerticesNumberArr.length ) {
                            return arrOfOrderedConnectedVerticesNumberArr[0];
                    }
                    arrOfOrderedConnectedVerticesNumberArr.forEach(function(elm) {
                        pathAcc.push(elm);
                    });
                }
                var result = getMaxPath(pathAcc);

                //TODO check path duplicate
                return result[0];
            }

            function getOrderedArrayOfArraysOfPointKey(/*Uint32Array*/ arrayOfPointKey) {
                var /*Array.<Array>*/ localNeighborsMap = createLocalNeighborsMap(arrayOfPointKey),
                    /*Uint8Array*/ used = new Uint8Array(arrayOfPointKey.length).fill(0),
                    /*Array.<Uint32Array>*/ arrayOfOrderedArrayOfPointKey = [];

                for (let i = 0; i < arrayOfPointKey.length; ++i) {
                    if (used[i] == 1) continue;
                    let nextGenArrayOfNumber = neighborsBWGraphTraversing(i, used, localNeighborsMap);

                    let orderedArrayOfNumber =
                        neighborsDFSGraphTraversingComplex(nextGenArrayOfNumber, localNeighborsMap);

                    let /*Uint32Array*/ orderedArrayOfPointKey =
                        getArrayFromVocabulary(orderedArrayOfNumber, arrayOfPointKey);
                    arrayOfOrderedArrayOfPointKey.push(orderedArrayOfPointKey);
                }

                return arrayOfOrderedArrayOfPointKey;
            }

            var /*Uint32Array*/ nextGenArrayOfPointKey = getNextGenerationArray(content);
            // nextGeneration have not any point, the end
            if (nextGenArrayOfPointKey.length == 0) return null;
            // order arrays
            var /*Array.<Uint32Array>*/ arrayOfOrderedNextGenArrayOfPointKey =
                    getOrderedArrayOfArraysOfPointKey(nextGenArrayOfPointKey);

            return checkArraysOrder(content, arrayOfOrderedNextGenArrayOfPointKey, node);

        }

        function getContentSquare(/*Array*/ content) {
            var maxX = 0,
                minX = Number.POSITIVE_INFINITY,
                maxY = 0,
                minY = Number.POSITIVE_INFINITY;

            function getMinMax(key) {
                let x = getX(key), y = getY(key);
                maxX = (x > maxX) ? x : maxX;
                minX = (x < minX) ? x : minX;
                maxY = (y > maxY) ? y : maxY;
                minY = (y < minY) ? y : minY;
            }

            for (let i = 0; i < content.length; ++i) {
                getMinMax(content[i]);
            }
            let width = (maxX - minX == 0) ? 1 : (maxX - minX),
                height = (maxY - minY == 0) ? 1 : (maxY - minY);
            return width * height;
        }

        function checkEndNodesProximity(/*Uint32Array*/ keyArr, /*Uint32Array*/ otherKeyArr, /*Number*/ delta) {
            var proximity = false;
            for (let i = 0; i < keyArr.length; ++i) {
                for (let k = 0; k < otherKeyArr.length; ++k) {
                    let deltaX = Math.abs(getX(keyArr[i]) - getX(otherKeyArr[k]));
                    let deltaY = Math.abs(getY(keyArr[i]) - getY(otherKeyArr[k]));

                    if (deltaX <= delta && deltaY <= delta) {
                        proximity = true;
                    }
                }
            }
            return proximity;
        }

        function drawPoint(ctx, key, color) {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.beginPath();
            var lastX = getX(key), lastY = getY(key);
            ctx.fillRect(lastX, lastY,1,1);
        }

        function drawLine(ctx, key1, key2, color) {
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.beginPath();
            var startX = getX(key1), startY = getY(key1);
            ctx.moveTo(startX, startY);
            var endX = getX(key2), endY = getY(key2);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }

        createPointMap(imgData);
        createAllNodeTree();
        pointMap.size = 0;
        pointMapUsed.size = 0;
        console.log("Total Root element after createPointTree(): " + rootNodeArr.length);
        console.log("Total End Nodes: " + endNodeArr.length + "   " + " " + allCreatedNodes.size);

        Array.from(allCreatedNodes).forEach(function(node, nodeCounter) {
            var color;
            if (nodeCounter < Colors.length) color = Colors[nodeCounter];
            else color = Colors[nodeCounter % Colors.length];
            let simplifyContent;
            if(node.charge === true || node.charge ===null) {
                simplifyContent = simplify(node.rContent, 2, true);
            }
            else if(node.charge === false) {
                simplifyContent = simplify(node.lContent, 0, true);
            }
            for(let i = 0; i < simplifyContent.length - 1; ++i) {
                //drawPoint(gCtx, simplifyContent[i], color);
                drawLine(gCtx, simplifyContent[i], simplifyContent[i+1], color);
            }

        });
    }
})(document);









