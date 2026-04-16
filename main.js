(function() {
    let template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host { display: block; width: 100%; height: 100%; }
            #ui5_content { 
                width: 100%; height: 100%; 
                min-height: 100px; 
                background: #fff3e0; 
                border: 2px dashed #ff9800;
                display: flex; align-items: center; justify-content: center;
                flex-direction: column;
                font-family: sans-serif;
            }
        </style>
        <div id="ui5_content">
            <h2 id="status_text">⏳ UI5 라이브러리 체크 중...</h2>
            <p id="debug_info"></p>
        </div>
    `;

    class UI5Hierarchy extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));
            console.log("위젯 생성자(Constructor) 호출됨");
        }

        // SAC에서 위젯을 처음 그리거나 업데이트할 때 호출
        onCustomWidgetAfterUpdate(changedProperties) {
            console.log("onCustomWidgetAfterUpdate 호출됨");
            this.checkAndRender();
        }

        checkAndRender() {
            const statusNode = this._shadowRoot.getElementById("status_text");
            const debugNode = this._shadowRoot.getElementById("debug_info");

            if (window.sap && sap.ui) {
                statusNode.innerText = "✅ SAP UI5 로드 완료!";
                statusNode.style.color = "#2e7d32";
                this.renderTable();
            } else {
                statusNode.innerText = "⚠️ SAP UI5를 찾을 수 없음";
                statusNode.style.color = "#d32f2f";
                debugNode.innerText = "운영 서버의 라이브러리 로딩을 기다리는 중입니다.";
            }
        }

        renderTable() {
            const content = this._shadowRoot.getElementById("ui5_content");
            content.style.background = "#e8f5e9";
            content.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <h2 style="color: #2e7d32;">🚀 하이라키 렌더링 준비 완료!</h2>
                    <p>GitHub 코드가 실시간으로 반영되었습니다.</p>
                    <button onclick="alert('연결 성공!')" style="padding: 10px 20px; cursor: pointer;">연결 테스트</button>
                </div>
            `;
        }
    }

    customElements.define("com-sap-custom-ui5-hier-live", UI5Hierarchy);
})();
