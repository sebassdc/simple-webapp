// imports necesarios
var express = require('express');
//var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var multer = require('multer');
var method_override = require("method-override");

var Schema = mongoose.Schema;

var cloudinary = require('cloudinary');

var app_password = "1234";
var uploader = multer({dest: "./uploads"});
var middleware_upload = uploader.single('image_avatar');
// JSON
// Configurar cloudinary
cloudinary.config({
	cloud_name: "sebassdc",
	api_key: "668483833688778",
	api_secret: "iOxbgW7dAAUmLwywsYp3eNHHvBk"
});

// Creamos objeto app con express
var app = express();
app.set('port', (process.env.PORT || 5000));
// environment

var conection_string = '127.0.0.1:27017/nodejs'
conection_string = 'sebassdc:l1c4n10@ds051585.mongolab.com:51585/first_try'

// Coneccion a base de datos
mongoose.connect("mongodb://" + conection_string);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Definir el schema de nuestros productos

var productSchemaJSON = {
	title:String,
	description:String,
	imageUrl:String,
	pricing: Number
};
var productSchema = new Schema(productSchemaJSON);
productSchema.virtual("image.url").get(function(){
	if(this.imageUrl == "" || this.imageUrl === "data.png"){
		return "default.jpg";
	}else{
		return this.imageUrl;
	}
});

//Definiendo el modelo de datos de product con mongo
var Product = mongoose.model("Product", productSchema);

// View con jade
app.set('views', __dirname + '/views');
app.set("view engine", "jade");

// Carpeta estatica con express
app.use(express.static(__dirname + '/public'));

// uso de override de method put con express
app.use(method_override("_method"));

// Funcion principal de request
app.get('/', function (solicitud, respuesta) {
  respuesta.render('index');
});

app.get("/menu", function(solicitud, respuesta){
	Product.find(function(error, documento){
		if(error){console.log(error); }
		respuesta.render("menu/index", {products: documento});
	});
});

app.get("/menu/new", function(solicitud, respuesta){
	respuesta.render("menu/new");
});

app.get("/menu/edit/:id", function(solicitud,respuesta){
	var id_producto = solicitud.params.id
	Product.findOne({_id: id_producto}, function(error, producto){
		console.log(producto);
		respuesta.render("menu/edit",{product: producto});
	});
});

app.get("/admin", function(solicitud, respuesta){
	respuesta.render("admin/form");
});

app.post("/menu", middleware_upload, function(solicitud, respuesta){
	if(solicitud.body.password == app_password){
		var data = {
			title: solicitud.body.title,
			description: solicitud.body.description,
			imageUrl: "data.png",
			pricing: solicitud.body.pricing
		}
		var product = new Product(data);
		if(solicitud.hasOwnProperty("file")){
			var imagen = solicitud.file.path;
			cloudinary.uploader.upload(imagen,function(result) {
				product.imageUrl = result.url;
				product.save(function(err){
					if(err){console.log(err);}
					respuesta.redirect("/admin");
				});
				console.log("url: ", product.imageUrl)
				console.log("Imagen Actualizada en cloudinary");
			});
		}else{
			console.log("no hay file")
			product.save(function(err){
				if(err){console.log(err);}
				respuesta.redirect("/admin");
			});
		}

	}
});

app.post("/admin", function(solicitud, respuesta){
	if(solicitud.body.password == app_password){
		Product.find(function(error, documento){
			if(error){console.log(error); }
			respuesta.render("admin/index", {products: documento});
		});
	}else{
		respuesta.redirect("/");
	}
});

app.put("/menu/:id", middleware_upload, function(solicitud, respuesta){
	if(solicitud.body.password == app_password){
		var data = {
			title: solicitud.body.title,
			description: solicitud.body.description,
			pricing: solicitud.body.pricing
		};
		if(solicitud.hasOwnProperty("file")){
			var imagen = solicitud.file.path;
			cloudinary.uploader.upload(imagen,function(result) {
				data.imageUrl = result.url;
				Product.update({"_id": solicitud.params.id}, data, function(){
					console.log("Producto actualizado en base de datos");
					respuesta.redirect("/menu");
				});
				console.log("url: ", data.imageUrl);
				console.log("Imagen Actualizada en cloudinary");
			});
		}else{
			Product.update({"_id": solicitud.params.id}, data, function(){
				respuesta.redirect("/menu");
			});
		}
	}else{
		console.log("contraseña incorrecta");
		//console.log(" solicitud", solicitud);
		respuesta.redirect("/admin");
	}
});

// Para eliminar productos
app.get("/menu/delete/:id", function(solicitud, respuesta){
	var id = solicitud.params.id;

	Product.findOne({"_id": id}, function(err, producto){
		respuesta.render("menu/delete", {producto: producto});
	});
});

app.delete("/menu/:id", middleware_upload, function(solicitud, respuesta){
	var id = solicitud.params.id;
	if(solicitud.body.password == app_password){
		Product.remove({"_id": id}, function(err){
			if(err){console.log(err);}
			console.log("producto removido");
			respuesta.redirect("/admin");
		});
	}else{
		console.log("Contraseña incorrecta");
		respuesta.redirect("/menu");
	}
});

// Definiendo puerto de escucha
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
