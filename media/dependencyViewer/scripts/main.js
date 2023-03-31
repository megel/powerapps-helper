//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    console.log('Initial Script', "");

    showProgress("Loading...");

    // @ts-ignore
    const vscode = acquireVsCodeApi();

    // State
    //const oldState = vscode.getState() || { solution: null };    
    //let solution = oldState.solution;

    const btnOverview = document.getElementById('btnEnvironmentOverview');
    if (btnOverview !== null) {
        // @ts-ignore
        btnOverview.addEventListener("click", (ev) => {
            // Show Overview by selecting no component
            onChangeViewMode("overview");
        });
      }

    const btnSolution = document.getElementById('btnSolutionOverview');
    if (btnSolution !== null) {
        // @ts-ignore
        btnSolution.addEventListener("click", (ev) => {
            console.log("btnSolutionOverview clicked");
            // Show Overview by selecting no component
            onSolutionClicked({ solutionId: "", viewMode: "graph"});
            onChangeViewMode("graph");
        });
      }
    const btnOpenGraphInEditor = document.getElementById('btnOpenGraphInEditor');
    if (btnOpenGraphInEditor !== null) {
        // @ts-ignore
        btnOpenGraphInEditor.addEventListener("click", (ev) => {
            console.log("btnOpenGraphInEditor clicked");
            vscode.postMessage({ command: 'openGraphInEditor', value: null });
        });
    }
      
    // updateColorList(colors);
    const slider = document.getElementById('zoomSlider');
        
    if (slider !== null) {
      // @ts-ignore
      slider.addEventListener("change", (ev) => {
        
        var slider = document.getElementById('zoomSlider');
        if (slider !== null) {
            // @ts-ignore
            zoomVal(slider.value);
        }
      });
    }

    console.log('Register Events', "");

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        console.log('Event received', event);
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'progress':
                {
                    showProgress(message.data || "");
                    break;
                }
            case 'updateContent':
                {
                    updateContent(message.data.caption || "", message.data.summary || "", message.data.graph || "", message.data.viewMode || "");
                    break;
                }
            
            case 'updateOverview':
                {
                    updateOverview(message.data.overview || "");
                    break;
                }

            case 'switchView':
                {
                    switchView(message.data);
                    break;
                }
        }
    });

    /** 
     * @param {any} data
     */
    function onSolutionClicked(data) {
        vscode.postMessage({ command: 'solutionSelected', value: data });
    }

    /** 
     */
    function onChangeViewMode(viewMode = "overview") {
        vscode.postMessage({ command: 'viewMode', value: viewMode });
    }
    
    /** 
     * @param {string} message
     */
    function showProgress(message = "") {
        console.log('Show Progress', message);
        const info = document.getElementById('info');
        if (info !==null) {
            info.innerText = message;
            info.style.visibility = (message ?? "").length ===0 ? "hidden" : "visible";
        }
    }

    function updateOverview(data = "") {
        console.log('Update Environment Content', data);
        let control = document.getElementById('environment');
        if (control !==null) {
            let child = createElementFromHTML("<div class=\"environment-container\">" + data + "</div>");
            console.log('Add environment container: ', child);
            if (child !== null) {
                control.replaceChildren(child);

                // Connect (Environment Overview)
                let solutions = document.getElementsByClassName("overview solution");
                
                for(var i = 0; i <solutions.length; ++i) {
                    var solution = solutions[i];
                    // @ts-ignore
                    solution.solutionId = solution.value;
                    solution.addEventListener("click", (ev) => {
                        console.log('Solution clicked: (Environment)', ev.currentTarget);
                        // @ts-ignore
                        let id = ev.currentTarget.solutionId ?? ev.currentTarget.value;
                        // Show Overview by selecting no component
                        if (id !== null) {
                            // @ts-ignore
                            onSolutionClicked({ solutionId: id, viewMode: "overview"});
                        }
                    });
                }
            }
        }    
        control = document.getElementById('btnSolutionOverview');
        if (control !==null) {
            control.style.visibility = (data ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('btnEnvironmentOverview');
        if (control !==null) {
            control.style.visibility = (data ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('btnOpenGraphInEditor');
        if (control !==null) {
            control.style.visibility = (data ?? "").length ===0 ? "hidden" : "hidden";
        }
        
        // Selection Buttons
        var buttons = document.getElementsByClassName('overview-filter-button');
        for(var i = 0; i <buttons.length; ++i) {
            var button = buttons[i];
            // @ts-ignore
            button.addEventListener("click", (ev) => {
                // console.log('Selection Button clicked: (Environment)', ev.currentTarget);
                // @ts-ignore
                let value = ev.currentTarget.getAttribute('value');
                console.log('Selection Button clicked: (Environment)', value, ev.currentTarget);
                // Show Overview by selecting no component
                if (value !== null) {
                    // @ts-ignore
                    vscode.postMessage({ command: 'selection', value: { select: value, viewMode: "overview"} });
                }
            });
        }
    }

    /** 
     * @param {string} caption
     */
    function updateContent(caption = "", summary = "", graph = "", viewMode = "overview") {
        console.log('updateContent ', caption, viewMode);
        let control = document.getElementById('caption');
        if (control !==null) {
            control.innerText = caption;
            control.style.visibility = (caption ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('summary');
        if (control !==null) {
            let child = createElementFromHTML("<div class=\"summary\">" + summary + "</div>");
            console.log('Add summary: ', child);
            if (child !== null) { control.replaceChildren(child); };
            control.style.visibility = (summary ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('graph');
        if (control !==null) {
            let child = createElementFromHTML("<div id=\"svg-container\" class=\"svg-container\">" + graph + "</div>");
            console.log('Add graph: ', child);
            if (child !== null) {
                control.replaceChildren(child);

                // Connect (graph nodes)
                let solutions = document.querySelectorAll('.node.solution');//getElementsByClassName("node solution");
                
                for(var i = 0; i <solutions.length; ++i) {
                    var solution = solutions[i];
                    // @ts-ignore
                    solution.solutionId = solution.id;
                    solution.addEventListener("click", (ev) => {
                        console.log('Solution clicked: (Graph)', ev.currentTarget);
                        // @ts-ignore
                        let id = ev.currentTarget.solutionId;                        
                        // Show Overview by selecting no component
                        if (id !== null) {
                            // @ts-ignore
                            onSolutionClicked({ solutionId: id, viewMode: "graph"});
                        }
                    });
                }
            }
            control.style.visibility = (graph ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('zoom');
        if (control !==null) {
            control.style.visibility = (graph ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('btnSolutionOverview');
        if (control !==null) {
            control.style.visibility = (graph ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('btnEnvironmentOverview');
        if (control !==null) {
            control.style.visibility = (graph ?? "").length ===0 ? "hidden" : "visible";
        }
        control = document.getElementById('btnOpenGraphInEditor');
        if (control !==null) {
            control.style.visibility = (graph ?? "").length ===0 || viewMode === "overview" ? "hidden" : "visible";
        }
        setZoom(10);
    }

    function switchView(data) {
        console.log('Switch View: ', data);
        switch (data.viewMode) {
            case 'graph':
                {
                    // @ts-ignore
                    document.getElementById('graphviz').style.display = 'block';
                    // @ts-ignore
                    document.getElementById('environment').style.display = 'none';
                    // @ts-ignore
                    document.getElementById('btnOpenGraphInEditor').style.visibility = 'visible';
                    break;
                }
            case 'overview':
                {
                    // @ts-ignore
                    document.getElementById('graphviz').style.display = 'none';
                    // @ts-ignore
                    document.getElementById('environment').style.display = 'block';
                    // @ts-ignore
                    document.getElementById('btnOpenGraphInEditor').style.visibility = 'hidden';
                    break;
                }
        }
        
        var control = document.getElementById('zoom');
        if (control !==null) {
            control.style.visibility = data.viewMode === 'overview' ? "hidden" : "visible";
        }        
    }
    

    function createElementFromHTML(htmlString) {
        var div = document.createElement('div');
        div.innerHTML = htmlString.trim();
        // Change this to div.childNodes to support multiple top-level nodes.
        return div.firstChild;
      }
    
    function setZoom(zoom, el) {			
        var transformOrigin = [0,0];
        el = el;// || instance.getContainer();
        var p = ["webkit", "moz", "ms", "o"],
            s = "scale(" + zoom + ")",
            oString = (transformOrigin[0] * 100) + "% " + (transformOrigin[1] * 100) + "%";
    
        for (var i = 0; i < p.length; i++) {
            if (el !== undefined && el.style !== undefined) {
                el.style[p[i] + "Transform"] = s;
                el.style[p[i] + "TransformOrigin"] = oString;
            }
        }
        if (el !== undefined && el.style !== undefined) {
            el.style["transform"] = s;
            el.style["transformOrigin"] = oString;
        }            
    }
    
    function zoomVal(a){
        var zoomScale = Number(a)/10;
        var elements  = document.getElementsByClassName('svg-container');

        for (var i=0; i<elements.length; i++) {
            setZoom(zoomScale, elements[i]);    
        }
    }

    showProgress(`Please select a Dataverse environment by [Ctrl + P] and "Visualize Dataverse Environment")`);

}());