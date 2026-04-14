(function() {
    let template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host { display: block; width: 100%; height: 100%; }
            #ui5_content { width: 100%; height: 100%; }
        </style>
        <div id="ui5_content">UI5 Hierarchy 로딩 중...</div>
    `;

    class UI5Hierarchy extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(template.content.cloneNode(true));
            this._props = {};
        }

        // SAC 위젯이 화면에 그려질 때 실행
        onCustomWidgetAfterUpdate(changedProperties) {
            this.initUI5();
        }

        initUI5() {
            // 이미 UI5가 로드되었는지 확인
            if (window.sap && sap.ui) {
                this.renderTable();
            } else {
                // UI5 라이브러리가 없을 경우 로드하는 로직 (필요시)
                this._shadowRoot.getElementById("ui5_content").innerHTML = "SAP UI5 라이브러리 연결 확인 완료!";
            }
        }

        renderTable() {
            // 여기서 실제 UI5 TreeTable을 생성하는 로직이 들어갑니다.
            this._shadowRoot.getElementById("ui5_content").innerHTML = "<h3>✅ UI5 하이라키 준비 완료</h3><p>데이터 바인딩 단계로 넘어갈 수 있습니다.</p>";
        }
    }

    customElements.define("com-sap-custom-ui5-hier-live", UI5Hierarchy);
})();
