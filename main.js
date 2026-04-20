(function () {
  const template = document.createElement('template')
  template.innerHTML = `
        <style>
            :host { display: block; width: 100%; height: 100%; }
            #ui5_container { width: 100%; height: 100%; min-height: 400px; background: #ffffff; }
        </style>
        <div id="ui5_container">UI5 데이터를 구성 중입니다...</div>
      `

  class Main extends HTMLElement {
    constructor () {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._root = this._shadowRoot.getElementById('ui5_container')
      this._table = null
    }

    // SAC가 위젯을 인식하자마자 즉시 실행하여 타임아웃 방지
    connectedCallback() {
      this.initUI5();
    }

    onCustomWidgetAfterUpdate (changedProps) {
      this.initUI5();
    }

    initUI5 () {
      // 이미 로드되어 있다면 즉시 렌더링
      if (window.sap && sap.ui && sap.ui.table) {
        this.render();
      } else {
        // 로딩 속도를 높이기 위해 필요한 라이브러리만 최소한으로 호출
        if (!document.getElementById("sap-ui-bootstrap")) {
          const script = document.createElement('script')
          script.src = 'https://sapui5.hana.ondemand.com/resources/sap-ui-core.js'
          script.id = 'sap-ui-bootstrap'
          script.dataset.sapUiLibs = 'sap.m,sap.ui.table'
          script.dataset.sapUiTheme = 'sap_horizon'
          script.onload = () => this.render()
          document.head.appendChild(script)
        }
      }
    }

    render () {
      if (this._table || !sap.ui.table) return;

      // 매뉴얼 데이터 (2단계)
      const oData = {
        root: [
          {
            name: "1. 부모 노드 (First Parent)",
            amount: "100,000",
            children: [
              { name: "1-1. 자식 노드 A", amount: "60,000" },
              { name: "1-2. 자식 노드 B", amount: "40,000" }
            ]
          },
          {
            name: "2. 부모 노드 (Second Parent)",
            amount: "200,000",
            children: [
              { name: "2-1. 자식 노드 C", amount: "150,000" },
              { name: "2-2. 자식 노드 D", amount: "50,000" }
            ]
          }
        ]
      };

      const oModel = new sap.ui.model.json.JSONModel(oData);
      this._table = new sap.ui.table.TreeTable({
        columns: [
          new sap.ui.table.Column({ label: "계층 (Hierarchy)", template: new sap.m.Text({ text: "{name}" }) }),
          new sap.ui.table.Column({ label: "금액 (Amount)", template: new sap.m.Label({ text: "{amount}", design: "Bold" }) })
        ],
        selectionMode: "Single",
        expandFirstLevel: true,
        visibleRowCountMode: "Auto"
      });

      this._table.setModel(oModel);
      this._table.bindRows("/root");
      this._table.placeAt(this._root);
    }
  }

  // 타임아웃을 피하기 위해 가장 마지막에 정의
  customElements.define('com-sap-sac-exercise-dyunespace-v1-main', Main)
})()
