/**
 * SAP SAC Custom Widget - Hierarchy Tree Widget (SAP UI5 기반)
 *
 * 파일: widget.js
 * 버전: 2.0.0
 *
 * [핵심]
 *  - SAP UI5 sap.m.Tree + sap.m.StandardTreeItem 사용
 *  - sap.ui.model.json.JSONModel 로 샘플 데이터 바인딩
 *  - SAC Custom Widget Web Component 안에서 UI5 Core 부트스트랩
 *
 * [주의]
 *  - UI5는 Shadow DOM 렌더링을 지원하지 않으므로 Light DOM 사용
 *  - SAC 런타임에는 이미 sap 객체가 존재 → 조건부 CDN 로드
 */

(function () {
  "use strict";

  const WIDGET_TAG = "com-custom-hierarchytreewidget";

  // ─────────────────────────────────────────────
  // 1. 샘플 데이터
  //    나중에 onCustomWidgetAfterUpdate 에서 SAC dataBinding으로 교체
  // ─────────────────────────────────────────────
  const SAMPLE_DATA = {
    nodes: [
      {
        id: "AS", text: "아시아", expanded: false,
        nodes: [
          { id: "AS_KR", text: "대한민국", nodes: [] },
          { id: "AS_JP", text: "일본",     nodes: [] },
          { id: "AS_CN", text: "중국",     nodes: [] },
          { id: "AS_IN", text: "인도",     nodes: [] }
        ]
      },
      {
        id: "EU", text: "유럽", expanded: false,
        nodes: [
          { id: "EU_DE", text: "독일",   nodes: [] },
          { id: "EU_FR", text: "프랑스", nodes: [] },
          { id: "EU_GB", text: "영국",   nodes: [] }
        ]
      },
      {
        id: "AM", text: "아메리카", expanded: false,
        nodes: [
          { id: "AM_US", text: "미국",   nodes: [] },
          { id: "AM_CA", text: "캐나다", nodes: [] },
          { id: "AM_BR", text: "브라질", nodes: [] }
        ]
      },
      {
        id: "AF", text: "아프리카", expanded: false,
        nodes: [
          { id: "AF_NG", text: "나이지리아", nodes: [] },
          { id: "AF_ZA", text: "남아프리카", nodes: [] }
        ]
      },
      {
        id: "OC", text: "오세아니아", expanded: false,
        nodes: [
          { id: "OC_AU", text: "호주",     nodes: [] },
          { id: "OC_NZ", text: "뉴질랜드", nodes: [] }
        ]
      }
    ]
  };

  // ─────────────────────────────────────────────
  // 2. UI5 부트스트랩 헬퍼
  //    SAC 환경 / 로컬 테스트 환경 모두 대응
  // ─────────────────────────────────────────────
  function loadUI5(callback) {
    // 케이스 A: SAC 런타임 - sap.ui + sap.m 이미 로드됨
    if (window.sap && window.sap.m && window.sap.m.Tree) {
      callback();
      return;
    }

    // 케이스 B: sap.ui 는 있지만 sap.m 이 없음 → require로 로드
    if (window.sap && window.sap.ui && window.sap.ui.require) {
      sap.ui.require([
        "sap/m/Tree",
        "sap/m/StandardTreeItem",
        "sap/ui/model/json/JSONModel",
        "sap/m/Toolbar",
        "sap/m/Title",
        "sap/m/ToolbarSpacer",
        "sap/m/Button",
        "sap/m/SearchField",
        "sap/m/VBox"
      ], callback);
      return;
    }

    // 케이스 C: UI5 전혀 없음 (로컬 테스트) → CDN 부트스트랩
    if (document.getElementById("sap-ui-bootstrap")) {
      // 이미 스크립트 태그는 있는데 아직 로딩 중
      document.getElementById("sap-ui-bootstrap").addEventListener("load", function () {
        sap.ui.getCore().attachInit(callback);
      });
      return;
    }

    const script = document.createElement("script");
    script.id    = "sap-ui-bootstrap";
    script.src   = "https://ui5.sap.com/1.120.1/resources/sap-ui-core.js";
    script.setAttribute("data-sap-ui-theme",          "sap_horizon");
    script.setAttribute("data-sap-ui-libs",           "sap.m");
    script.setAttribute("data-sap-ui-compatVersion",  "edge");
    script.setAttribute("data-sap-ui-async",          "false");
    script.onload = function () {
      sap.ui.getCore().attachInit(callback);
    };
    document.head.appendChild(script);
  }

  // ─────────────────────────────────────────────
  // 3. 검색 필터 유틸
  // ─────────────────────────────────────────────
  function filterNodes(nodes, query) {
    if (!query) return nodes;
    return nodes
      .map(function (node) {
        const childMatch = filterNodes(node.nodes || [], query);
        const selfMatch  = node.text.toLowerCase().includes(query);
        if (!selfMatch && childMatch.length === 0) return null;
        return Object.assign({}, node, {
          nodes:    selfMatch ? node.nodes : childMatch,
          expanded: true
        });
      })
      .filter(Boolean);
  }

  // ─────────────────────────────────────────────
  // 4. UI5 트리 빌더
  // ─────────────────────────────────────────────
  function buildUI5Tree(container, widgetInstance) {
    sap.ui.require([
      "sap/m/Tree",
      "sap/m/StandardTreeItem",
      "sap/ui/model/json/JSONModel",
      "sap/m/Toolbar",
      "sap/m/Title",
      "sap/m/ToolbarSpacer",
      "sap/m/Button",
      "sap/m/SearchField",
      "sap/m/VBox"
    ], function (
      Tree, StandardTreeItem, JSONModel,
      Toolbar, Title, ToolbarSpacer, Button, SearchField, VBox
    ) {

      // ── JSONModel 생성 ──────────────────────
      const oModel = new JSONModel(JSON.parse(JSON.stringify(SAMPLE_DATA)));

      // ── Tree ───────────────────────────────
      const oTree = new Tree({
        mode: "SingleSelectMaster",
        includeItemInSelection: true,
        width: "100%",
        selectionChange: function (oEvent) {
          const oItem = oEvent.getParameter("listItem");
          if (!oItem) return;
          const oCtx  = oItem.getBindingContext();
          const oData = oCtx ? oCtx.getObject() : null;
          if (oData) {
            widgetInstance._fireSelectEvent(oData, oCtx.getPath());
          }
        }
      });

      // StandardTreeItem 바인딩 (재귀: arrayNames: ["nodes"])
      oTree.bindItems({
        path: "/nodes",
        template: new StandardTreeItem({ title: "{text}" }),
        parameters: { arrayNames: ["nodes"] }
      });

      oTree.setModel(oModel);

      // ── 툴바 ───────────────────────────────
      const oToolbar = new Toolbar({
        content: [
          new Title({ text: "지역 / 도시 계층" }),
          new ToolbarSpacer(),
          new Button({
            text: "모두 펼치기",
            icon: "sap-icon://expand-group",
            press: function () { oTree.expandToLevel(1); }
          }),
          new Button({
            text: "모두 접기",
            icon: "sap-icon://collapse-group",
            press: function () { oTree.collapseAll(); }
          })
        ]
      });

      // ── 검색 필드 ──────────────────────────
      const oSearch = new SearchField({
        placeholder: "노드 검색...",
        width: "100%",
        liveChange: function (oEvent) {
          const sQuery = oEvent.getParameter("newValue").toLowerCase().trim();
          const filtered = filterNodes(SAMPLE_DATA.nodes, sQuery);
          oModel.setData({ nodes: filtered });
          if (sQuery) { oTree.expandToLevel(1); }
        }
      });

      // ── VBox 레이아웃 ──────────────────────
      const oVBox = new VBox({
        width:  "100%",
        height: "100%",
        items:  [oToolbar, oSearch, oTree]
      });

      oVBox.placeAt(container);

      // 인스턴스에 참조 저장
      widgetInstance._ui5Model = oModel;
      widgetInstance._ui5Tree  = oTree;
      widgetInstance._ui5VBox  = oVBox;
    });
  }

  // ─────────────────────────────────────────────
  // 5. Web Component 정의
  // ─────────────────────────────────────────────
  class HierarchyTreeWidget extends HTMLElement {

    static get observedAttributes() {
      return ["level1label", "level2label", "showcount", "expandall"];
    }

    constructor() {
      super();
      this._container  = null;
      this._ui5Model   = null;
      this._ui5Tree    = null;
      this._ui5VBox    = null;
    }

    connectedCallback() {
      // UI5는 Shadow DOM 미지원 → Light DOM에 컨테이너 생성
      if (!this._container) {
        this._container = document.createElement("div");
        this._container.style.cssText = "width:100%;height:100%;";
        this.appendChild(this._container);
      }
      loadUI5(() => buildUI5Tree(this._container, this));
    }

    disconnectedCallback() {
      if (this._ui5VBox) {
        try { this._ui5VBox.destroy(); } catch (e) {}
        this._ui5VBox = null;
      }
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      // 프로퍼티 패널 변경 반영 (필요 시 확장)
    }

    // ── SAC Custom Widget 표준 콜백 ──────────

    onCustomWidgetBeforeUpdate(changedProps) {
      // 프로퍼티 패널 값이 바뀌기 직전에 호출됨
    }

    onCustomWidgetAfterUpdate(changedProps) {
      /**
       * TODO: SAC 데이터 바인딩 연결
       *
       * const binding = this.dataBindings.getDataBinding("hierarchyDimension");
       * const result  = binding.getResultSet();
       *
       * // result를 SAMPLE_DATA 형태로 변환
       * const converted = transformSACResult(result);
       *
       * if (this._ui5Model) {
       *   this._ui5Model.setData(converted);
       * }
       */
    }

    onCustomWidgetResize(width, height) {
      if (this._container) {
        this._container.style.width  = width  + "px";
        this._container.style.height = height + "px";
      }
    }

    // ── SAC 이벤트 발행 ─────────────────────
    _fireSelectEvent(oData, sPath) {
      // path 에서 레벨 계산: "/nodes/0/nodes/1" → nodes 등장 2번 = 레벨 2
      const level = (sPath.match(/\/nodes\//g) || []).length;

      const detail = {
        id:    oData.id,
        text:  oData.text,
        path:  sPath,
        level: level   // 1 = 상위차원(지역), 2 = 하위차원(도시)
      };

      this.dispatchEvent(new CustomEvent("onNodeSelect", {
        detail,
        bubbles:  true,
        composed: true
      }));

      console.log("[HierarchyTreeWidget] 선택:", detail);
    }
  }

  // ─────────────────────────────────────────────
  // 6. Custom Element 등록
  // ─────────────────────────────────────────────
  if (!customElements.get(WIDGET_TAG)) {
    customElements.define(WIDGET_TAG, HierarchyTreeWidget);
  }

})();
