var express = require('express');
var router = express.Router();

/* GET home page. */
/* this is top */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/login', function(req,res,next){
		if(req.body.name){
        console.log(req.body);
        console.log(req.body.name + "がコネクトしました");
			  res.render('top', {title: "MHX room", name: req.body.name});
        //res.send("hello");
		} else {
				res.redirect('/');
		}
});

router.post('/room', function(req,res,next){
  //console.log(req.body);
  if(req.body.roomname && req.body.mes){
    //console.log("success!!");
    res.render('top', {title : "MHX room", name: "foo"});
  } else {
    console.log("failed");
    res.redirect('/');
  }
});

module.exports = router;
