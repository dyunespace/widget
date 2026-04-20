(function () {
  const template = document.createElement('template')
  template.innerHTML = `
        <style>
            :host { display: block; width: 100%; height: 100%; }
            #ui5_container { width: 100%; height: 100%; }
            /* UI5 테이블 높이 강제 지정 */
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
      if (window.sap && sap.ui) {
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

    async render () {
      const dataBinding = this.dataBinding
      if (!dataBinding || dataBinding.state !== 'success') return

      // 1. SAC 데이터를 트리용 JSON 구조로 변환
      const treeData = this.transformData(dataBinding)

      if (!this._table) {
        sap.ui.getCore().attachInit(() => {
          this._table = new sap.ui.table.TreeTable({
            columns: [
              new sap.ui.table.Column({
                label: "Hierarchy (Dimension)",
                template: new sap.m.Text({ text: "{name}" })
              }),
              new sap.ui.table.Column({
                label: "Measure Value",
                template: new sap.m.Text({ text: "{value}" })
              })
            ],
            selectionMode: "Single",
            enableColumnReordering: false,
            expandFirstLevel: true,
            visibleRowCountMode: "Auto"
          })
          
          const oModel = new sap.ui.model.json.JSONModel()
          this._table.setModel(oModel)
          this._table.placeAt(this._root)
        })
      }

      // 2. 모델에 데이터 업데이트
      if (this._table && this._table.getModel()) {
        this._table.getModel().setData({ root: treeData })
        this._table.bindRows("/root")
      }
    }

    // SAC 데이터를 계층 구조로 변환하는 핵심 함수
    transformData (data) {
      const rows = data.data
      const result = []

      rows.forEach(row => {
        // 차원의 ID나 텍스트를 이름으로 사용
        const name = row.dimensions_0.label || row.dimensions_0.id
        const value = row.measures_0.raw
        
        // 여기에 계층 정보(Parent ID 등)가 있다면 추가 로직을 넣을 수 있습니다.
        // 현재는 단순 리스트를 트리 노드로 보여주는 예시입니다.
        result.push({
          name: name,
          value: value,
          children: [] // 실제 하이라키 정보를 여기서 재귀적으로 구성 가능
        })
      })

      return result
    }
  }

  customElements.define('com-sap-sac-exercise-username-main', Main)
})()
