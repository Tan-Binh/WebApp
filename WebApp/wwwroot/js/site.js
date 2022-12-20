var map;

require(["esri/map", "esri/Color", "esri/dijit/HomeButton", "esri/dijit/LocateButton",
    "esri/dijit/Scalebar", "esri/dijit/Measurement", "dojo/dom",
    "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol",  "esri/dijit/InfoWindow",
    "esri/dijit/Popup", "dojo/dom-construct", "esri/dijit/PopupTemplate",
    "esri/tasks/QueryTask", "esri/tasks/query", "esri/geometry/Extent",
    "esri/renderers/SimpleRenderer", "esri/layers/LabelLayer", "esri/symbols/TextSymbol",
    "esri/symbols/SimpleLineSymbol", "esri/layers/LabelClass",
    "dojo/domReady!"],
    function (Map, Color, HomeButton, LocateButton, Scalebar,
        Measurement, dom, FeatureLayer, SimpleFillSymbol, InfoWindow,
        Popup, domConstruct, PopupTemplate, QueryTask, Query, Extent,
        SimpleRenderer, LabelLayer, TextSymbol, SimpleLineSymbol, LabelClass) {


        //Link data được nhét lên gis oline
        var linkDanSo = "https://services3.arcgis.com/U26uBjSD32d7xvm2/arcgis/rest/services/DuLieuDanSo/FeatureServer/0";

        map = new Map("mapDiv", {
            basemap: "topo-vector",  //for full list of pre-defined basemaps, navigate to http://arcg.is/1jvo6wd
            center: [108.475019, 14.259767], // longitude, latitude
            zoom: 7,
            logo: false,
            sliderPosition: "bottom-right",
            showLabels: true
        });

        //Tạo nút home
        var home = new HomeButton({
            map: map
        }, "HomeButtonDiv");
        home.startup();

        //Tạo nút trở lại vị trí ban đầu được thiết lập sẵn (VN)
        var geoLocate = new LocateButton({
            map: map
        }, "LocateButtonDiv");
        geoLocate.startup();

        //Tạo thanh Scalebar phía dưới màn hình
        var Scalebar = new Scalebar({
            map: map,
            // "dual" displays both miles and kilometers
            // "english" is the default, which displays miles
            // use "metric" for kilometers
            scalebarUnit: "metric",
            attachTo: "bottom-center"
        });

        //Tạo công cụ đo (Chức năng để cho vui)
        var measurement = new Measurement({
            map: map
        }, dom.byId("measurementDiv"));
        measurement.startup();

        // create a renderer for the states layer to override default symbology
        //Màu chữ của label 
        var DanSoColor = new Color("#000000");
        //var DanSoLine = new SimpleLineSymbol("solid", DanSoColor, 1.5);
        //var DanSoSymbol = new SimpleFillSymbol("solid", DanSoLine, null);
        //var DanSoRenderer = new SimpleRenderer(DanSoSymbol);

        //Khởi tạo layer bản đồ trên gis online vào
        var DanSo = new FeatureLayer(linkDanSo, {
            mode: FeatureLayer.MODE_ONDEMAND,
            opacity: 1,
            outFields: ["*"]
        });
        //DanSo.setRenderer(DanSoRenderer);

        // create a text symbol to define the style of labels
        //Định dạng chữ cho label
        var DanSoLabel = new TextSymbol().setColor(DanSoColor);
        DanSoLabel.font.setSize("9pt");
        DanSoLabel.font.setFamily("arial");

        //Trường dữ liệu dùng để làm label
        var json = {
            "labelExpressionInfo": { "value": "{NameVi}" }
        };

        //create instance of LabelClass (note: multiple LabelClasses can be passed in as an array)
        //Tạo label
        var labelClass = new LabelClass(json);
        labelClass.symbol = DanSoLabel; // symbol also can be set in LabelClass' json
        DanSo.setLabelingInfo([labelClass]);

        //Nhét layer bản đồ cùng với label vào map
        map.addLayer(DanSo);

        //Chức năng click vào tỉnh nào thì hiện thông tin tỉnh đó góc trái trên (Không biết làm sao để nó nằm góc khác)
        DanSo.on("click", function (evt) {
            var attrs = evt.graphic.attributes;

            var content = "";
            content += "<div>Tên tỉnh: " + attrs.NameVi + "</div>";
            content += "<div>Năm 2016: " + attrs.F2016 + "</div>";
            content += "<div>Năm 2017: " + attrs.F2017 + "</div>";
            content += "<div>Năm 2018: " + attrs.F2018 + "</div>";
            content += "<div>Năm 2019: " + attrs.F2019 + "</div>";
            content += "<div>Năm 2020: " + attrs.F2020 + "</div>";
            content += "<div>Năm 2021: " + attrs.F2021 + "</div>";
            content += "<div>Tỉ lệ tăng trung bình sau 6 năm: " + TiLeTang(attrs.F2016, attrs.F2017, attrs.F2018, attrs.F2019, attrs.F2020, attrs.F2021) + "%</div>";
            content += "<img src='../img/" + attrs.NameEn + ".png' style='width:100%'>";
            
            map.infoWindow.setTitle("Thông tin dân số năm 2016 - 2021 (nghìn người)");
            map.infoWindow.resize(400, 500);
            map.infoWindow.setContent(content);
            map.infoWindow.show();
        });

        //Chức năng search
        $("#btnSearch").click(function () {

            $("#txtMessage").html("Đang tìm kiếm...");
            var name = $("#txtName").val();
            var where = "1=1"; //Tìm hết

            if (name) {
                where += " AND NameVi LIKE '%" + name + "%' OR Name LIKE '%" + name + "%'";
            }
            $("#txtMessage").html("Đang tìm kiếm...");
            $("#searchResults").html("");

            var query = new Query();
            var queryTask = new QueryTask(linkDanSo);
            query.where = where;
            query.outSpatialReference = { wkid: 102100 };
            query.returnGeometry = true;
            query.outFields = ["*"];
            queryTask.execute(query, function (results) {
                console.log(results);

                var html = "";
                if (results.features) {
                    $("#txtMessage").html("Tìm được: " + results.features.length);
                    for (var i = 0; i < results.features.length; i++) {
                        var feat = results.features[i];
                        html += "<tr><td><span class='btn btn-sm btn-danger zoomToData' alt='" + feat.attributes.FID + "'><i class='fa-solid fa-magnifying-glass-location'></i></span></td><td>"
                            + feat.attributes.NameVi + "</td><td>"
                            + feat.attributes.F2016 + "</td><td>"
                            + feat.attributes.F2017 + "</td><td>"
                            + feat.attributes.F2018 + "</td><td>"
                            + feat.attributes.F2019 + "</td><td>"
                            + feat.attributes.F2020 + "</td><td>"
                            + feat.attributes.F2021 + "</td><td>"
                            + TiLeTang(feat.attributes.F2016, feat.attributes.F2017, feat.attributes.F2018, feat.attributes.F2019, feat.attributes.F2020, feat.attributes.F2021) + "%</td></tr>";
                        $("#searchResults").html(html);
                        console.log(feat.attributes.F2021);
                    }
                }
                else {
                    $("#txtMessage").html("Không có kết quả");
                }
            });
        });

        //Chức năng nhấn vào nút icon màu đỏ để di chuyển tới tỉnh đã chọn 
        $("#searchResults").on("click", "span.zoomToData", function () {
            var FID = $(this).attr('alt');

            var query = new Query();
            query.where = "FID = " + FID;
            DanSo.selectFeatures(query, FeatureLayer.SELECTION_NEW, function (result) {
                if (result) {
                    if (result.length > 0) {
                        var feat = result[0];
                        var pointZoom = feat.geometry.cache._extent;

                        var extent = new Extent(pointZoom.xmin, pointZoom.ymin,
                            pointZoom.xmax, pointZoom.ymax, map.spatialReference);

                        map.setExtent(extent);
                    }
                }
            });
        });

        //Các chức năng đóng mở cửa sổ
        var isOpenSearch = false;
        $("#searchButton").click(function () {
            if (isOpenSearch == false) {
                closeEverything();
                $("#searchContainer").addClass("has-width");
                $("#searchContainer").removeClass("no-width");
                isOpenSearch = true;
            }
            else {
                closeEverything();
            }

        });

        var isOpenMeasurement = false;
        $("#measurementButton").click(function () {
            if (isOpenMeasurement == false) {
                closeEverything();
                $("#measurementContainer").addClass("has-width");
                $("#measurementContainer").removeClass("no-width");
                isOpenMeasurement = true;
            }
            else {
                closeEverything();
            }
        });

        function closeEverything() {
            $(".card-panel").addClass("no-width");
            $(".card-panel").removeClass("has-width");
            isOpenMeasurement = false;
            isOpenSearch = false;
        }
    });

function TiLeTang(N2016, N2017, N2018, N2019, N2020, N2021) {
    let N16ToN17 = (N2017 / (N2016 / 100)) - 100;
    let N17ToN18 = (N2018 / (N2017 / 100)) - 100;
    let N18ToN19 = (N2019 / (N2018 / 100)) - 100;
    let N19ToN20 = (N2020 / (N2019 / 100)) - 100;
    let N20ToN21 = (N2021 / (N2020 / 100)) - 100;
    let result = (N16ToN17 + N17ToN18 + N18ToN19 + N19ToN20 + N20ToN21) / 5;
    return result.toFixed(2);
}