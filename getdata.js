var request = require("request");
var StringBuffer = require("stringtypebuffer").StringBuffer;
var fs = require("fs");
var path = require("path");

var jar = request.jar();
var cookie = request.cookie("sid=5ee4f881-59e1-4535-9dc2-ca3181ba79b1");
var url = "http://skfd.skong.com/pro/info/getProductTree";
var strbuffer = new StringBuffer();
jar.setCookie(cookie, url);


var domain = "http://skong-pro.skong.com/";
var skm = "http://skong-pro.skong.com/asset/resource/model/{id}/0000/low/scene.skm";
var scene = "http://skong-pro.skong.com/asset/resource/model/{id}/0000/low/scene.json";
var topview = "http://skong-pro.skong.com/asset/resource/model/{id}/0000/topview.png";
var content = {};
var id = 0;

// 递归创建目录 同步方法
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}


function downLoadResource(unit, absolutepath) {
    var modelVersion = unit.modelVersion;
    var modelId = unit.modelId;
    var preview = unit.previewUrl;
    var name = unit.name;

    var previewUrl = domain.toString().concat(preview);
    var modelurl = skm.replace("{id}", modelId);
    var sceneurl = scene.replace("{id}", modelId);
    var topviewurl = topview.replace("{id}", modelId);

    var pngPath = absolutepath.concat("\\preview.png");
    var modelPath = absolutepath.concat("\\model.skm");
    var scenePath = absolutepath.concat("\\scene.json");
    var topviewPath = absolutepath.concat("\\topview.png");

    id++;
    if (!fs.existsSync(absolutepath)) {
        var rativepath = absolutepath.substr(__dirname.length).substr(1);
        mkdirsSync(rativepath);
    }

    //  var object = {};
    //  object.path = absolutepath;
    //  object.previewUrl = previewUrl;
    //  object.modelurl = modelurl;
    //  object.sceneurl = sceneurl;
    //  object.topviewurl = topviewurl;
    //  object.pngPath = pngPath;
    //  object.modelPath = modelPath;
    //  object.scenePath = scenePath;
    //  object.topviewPath = topviewPath;
    //  content[id] = object;
    downLoad(previewUrl, pngPath);
    downLoad(modelurl, modelPath);
    downLoad(sceneurl, scenePath);
    downLoad(topviewurl, topviewPath);
    //  var str = JSON.stringify(content);
    //  fs.writeFileSync("content.json", str);
}


function downLoad(url, savePath) {
    request.get(url)
        .on('error', function(err) {
            downLoad(url, savePath);
        }).pipe(fs.createWriteStream(savePath))
}



function getductInfo(id, absolutepath) {
    strbuffer.clear();
    var infoUrl = "http://skfd.skong.com/pro/info/getProductInfoList?"
    var key = "queryContent.mtlCategoryId="
    var infoid = id.toString();
    var page = "&queryPage.currentPage=0&queryPage.maxRows=20"
    strbuffer.pushString(infoUrl);
    strbuffer.pushString(key);
    strbuffer.pushString(infoid);
    strbuffer.pushString(page);
    var infourl = strbuffer.toString();
    request({ url: infourl, jar: jar }, function(err, reponese, result) {
        if (result) {
            var res = (JSON.parse(result));
            if (res.data && res.data.rows) {
                var rows = res.data.rows;
                if (rows.length > 0) {
                    for (var i = 0; i < rows.length; i++) {
                        var unit = rows[i];

                        downLoadResource(unit, absolutepath.concat("\\").concat(unit.name));
                    }
                }
            }
        }
        if (err) {
            console.log(err);
        }
    });
}
var namelist = ["烟台实测模型", "建筑构建", "家装主材", "活动家具", "家纺布艺", "家用电器", "家居饰品"]
    /** */
function getUnit(data, absolutepath) {
    if (data.length == null) {
        console.log("erro");
    }
    var currentPath = absolutepath;
    var length = data.length;
    for (var i = 0; i < length; i++) {
        var child = data[i];
        if (child.name) {
            currentPath = absolutepath.concat("\\").concat(child.name);
        }
        if (currentPath.search(namelist[1]) > 0) {
            if (child.children.length > 0) {
                getUnit(child.children, currentPath);
            } else {
                getductInfo(child.id, currentPath);
            }
        }
    }
}


request({ url: url, jar: jar }, function(err, reponese, result) {
    var data = JSON.parse(result).data;
    getUnit(data, __dirname);

});