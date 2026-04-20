(function () {
  const template = document.createElement('template')
  template.innerHTML = `
        <style>
            :host { display: block; width: 100%; height: 100%; }
            #ui5_container { width: 100%; height: 100%; min-height: 400px; }
            /* UI5 테이블이 영역을 꽉 채우도록 설정 */
            .sapUiTable { height: 100% !important; }
        </style>
        <div id="ui5_container"></div>
      `

  class Main extends HTMLElement {
    constructor () {
      super()
      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(template.content.cloneNode(true))
      this._root = this._shadowRoot.getElementById('ui5_container')
      this._table = null
    }

    onCustomWidgetAfterUpdate (changedProps) {
      this.initUI5()
    }

    initUI5 () {
      // UI5 라이브러리 체크 및 로드
      if (window.sap && sap.ui && sap.ui.table) {
        this.render()
      } else {
        const script = document.createElement('script')
        script.src = 'https://sapui5.hana.ondemand.com/resources/sap-ui-core.js'
        script.id = 'sap-ui-bootstrap'
        script.dataset.sapUiLibs = 'sap.m,sap.ui.table'
        script.dataset.sapUiTheme = 'sap_horizon'
        script.onload = () => this.render()
        document.head.appendChild(script)
      }
    }

    render () {
      if (this._table) return; // 이미 테이블이 있으면 중복 생성 방지

      sap.ui.getCore().attachInit(() => {
        // 1. 2단계 매뉴얼 데이터 정의
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

        // 2. 모델 생성 및 데이터 세팅
        const oModel = new sap.ui.model.json.JSONModel(oData);

        // 3. TreeTable 생성
        this._table = new sap.ui.table.TreeTable({
          columns: [
            new sap.ui.table.Column({
              label: "계층 구조 (Hierarchy)",
              template: new sap.m.Text({ text: "{name}" })
            }),
            new sap.ui.table.Column({
              label: "금액 (Amount)",
              template: new sap.m.Label({ text: "{amount}", design: "Bold" })
            })
          ],
          selectionMode: "Single",
          enableColumnReordering: false,
          expandFirstLevel: true, // 첫 번째 레벨 자동 확장
          visibleRowCountMode: "Auto"
        });

        this._table.setModel(oModel);
        this._table.bindRows("/root");

        // 4. 화면에 배치
        this._table.placeAt(this._root);
      });
    }
  }

  // index.json의 tag와 반드시 일치해야 함
  customElements.define('com-sap-sac-exercise-dyunespace-v1-main', Main)
})()
