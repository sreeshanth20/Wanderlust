const Listing = require("../models/listing.js");
const axios = require('axios');


module.exports.index = async (req, res, next) => {
  try {
    const { q } = req.query;
    let allListings;
    if (q) {
      const regex = new RegExp(q, "i");
      allListings = await Listing.find({
        $or: [
          { title: regex },
          { location: regex },
          { country: regex }
        ]
      });
    } else {
      allListings = await Listing.find({});
    }

    res.render("listings/index", { allListings });
  } catch (err) {
    console.error("Error in index route:", err);
    next(err); // this will hit your global error handler
  }
};


module.exports.renderNewForm=(req,res)=>{
    res.render("listings/new.ejs");
  }

module.exports.showListing=async(req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id).populate({
      path:"reviews",
      populate: {
        path:"author",
      }
    }).populate("owner");
    if(!(listing))
    {
      req.flash("error","The Listing you requested for does not exist");
      res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});
  }

module.exports.createListing=async(req,res,next)=>{

  const { listing } = req.body;
  let coordinates = [77.1025, 28.7041]; // fallback (Delhi)

  try {
    const geoRes = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: listing.location,
          format: "json",
          limit: 1
        },
        headers: {
          "User-Agent": "wanderlust-app (rsreeshanth@gmail.com)"
        },
        timeout: 5000
      }
    );
  
    if (geoRes.data.length > 0) {
      const lat = parseFloat(geoRes.data[0].lat);
      const lon = parseFloat(geoRes.data[0].lon);
      coordinates = [lon, lat];
      console.log("Coordinates:", coordinates);
    }
  
  } catch (err) {
    console.log("Geocoding failed. Using fallback coordinates.");
  }
  

  // let url=req.file.path;
  // let filename=req.file.filename;
      const newListing=new Listing(req.body.listing);
      newListing.owner=req.user._id;
  //     newListing.image={url,filename};
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  }
      newListing.geometry = {
      type: 'Point',
      coordinates: coordinates
    };
      await newListing.save();
      req.flash("success","New Listing added successfully!!!!!");
      res.redirect("/listings");
    }

module.exports.renderEditForm=async(req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!(listing))
      {
        req.flash("error","The Listing you requested for does not exist");
        res.redirect("/listings");
      }
      let originalImageUrl=listing.image.url;
      originalImageUrl=originalImageUrl.replace("/upload","/upload/h_300,w_250");
    res.render("listings/edit.ejs",{listing, originalImageUrl});
  }

module.exports.updateListing=async(req,res)=>{
    if(!req.body.listing)
      {
        throw new ExpressError(400,"Send valid data for listing");
      }
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if(typeof req.file!="undefined")
    {
      let url=req.file.path;
      let filename=req.file.filename;
      listing.image={url,filename};
      await listing.save();
    }
    req.flash("success","Listing Updated successfully!");
    res.redirect(`/listings/${id}`);
  }

module.exports.destroyListing=async(req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted successfully!");
    res.redirect("/listings");
  }