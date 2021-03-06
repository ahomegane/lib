/* version: 1.0.0 */
/* require: none */
;(function(document, window) {

  window._l = window._l || {};
  _l.media = _l.media || {};

  /**
  * CannyEdgeDetector Class
  */
  var CannyEdgeDetecotor = function(options) {
    
    this.imageData = options.imageData;
    //params
    this.GaussianSiguma = options.GaussianSiguma || 4;
    this.GaussianSize = options.GaussianSize || 5;
    this.hysteresisHeigh = options.hysteresisHeigh || 100;
    this.hysteresisLow = options.hysteresisLow || 30;
    //実行制御
    this.isConvertGrayScale = options.isConvertGrayScale != null ? options.isConvertGrayScale : true;
    this.isApplyGaussianFilter = options.isApplyGaussianFilter != null ? options.isApplyGaussianFilter : true;
    this.isApplySobelFilter = options.isApplySobelFilter != null ? options.isApplySobelFilter : true;
    if(this.isApplySobelFilter == true) {
      this.isHysteresisThreshold = options.isHysteresisThreshold != null ? options.isHysteresisThreshold : true;
    } else {
      this.isHysteresisThreshold = false;
    }

    this.color;//color matrix
    
    /**
    * this.convertGrayScaleでtrueに変更。
    * this.colorMatrixToImageData および this.imageDataTocolorMatrix は、この値により処理を分岐。
    * trueの場合： this.color = [], falseの場合： this.color={r:[], g:[], b[]}　として扱う。
    * グレースケールおよびカラー、両方とも可能なfilterの場合は処理を分岐させる。
    */
    this.isGrayScale = false;

    //for sobel filter
    this.edge;//edge matrix
    this.edgeDir;//edgeDir matrix

    this.edgeHeighVal = 255;
    this.edgeLowVal = 0;

    this.fn = CannyEdgeDetecotor.prototype;
    
    return this.init();    
  }
  CannyEdgeDetecotor.prototype = {
    
    init: function() {
      if(this.isConvertGrayScale) this.convertGrayScale(this.imageData);
      if(this.isApplyGaussianFilter) this.applyGaussianFilter(this.imageData, this.GaussianSiguma, this.GaussianSize);
      if(this.isApplySobelFilter) this.applySobelFilter(this.imageData);
      if(this.isHysteresisThreshold) this.hysteresisThreshold(this.imageData, this.hysteresisHeigh, this.hysteresisLow);
    },
    
    convertGrayScale: function(imageData) {
      
      this.isGrayScale = true;
      
      var data = imageData.data, pixels = data.length/4;
      for(var i=0,l=pixels; i<l; i++) {
        var r = data[i*4], g = data[i*4+1],b = data[i*4+2];
        var g = parseInt((11*r + 16*g + 5*b) / 32);
        
        data[i*4] = g;
        data[i*4+1] = g;
        data[i*4+2] = g;
      }
      
    },
    
    applyGaussianFilter: function(imageData,siguma,filterW) {
      
      //make filter
      var filter = [];
      var k = 1 / Math.sqrt(2 * Math.PI) / siguma;
      for(var x=0;x<filterW;x++) {
        filter[x] = [];
        for(var y=0;y<filterW;y++) {
          var _x = x-parseInt(filterW/2-0.5),//中心座標を0に
            _y = y-parseInt(filterW/2-0.5);
          filter[x][y] = k * Math.exp(-(_x * _x + _y * _y) / (2 * siguma * siguma));
        }
      }
      
      var color = this.imageDataToColorMatrix(imageData);
      
      var w = imageData.width, h = imageData.height;

      //filter
      for(var x=0;x<w;x++) {
        for(var y=0;y<h;y++) {
          for(var xf=0;xf<filterW;xf++) {
            for(var yf=0;yf<filterW;yf++) {
              
              var _xf= xf-parseInt(filterW/2-0.5),
                _yf= yf-parseInt(filterW/2-0.5);
              if((x+_xf) > -1 && (y+_yf) > -1 && (x+_xf) < w && (y+_yf) < h) {
                if(this.isGrayScale) {
                  color.origin[x+_xf][y+_yf] += color.copy[x][y]*filter[xf][yf];
                } else {
                  color.origin.r[x+_xf][y+_yf] += color.copy.r[x][y]*filter[xf][yf];
                  color.origin.g[x+_xf][y+_yf] += color.copy.g[x][y]*filter[xf][yf];
                  color.origin.b[x+_xf][y+_yf] += color.copy.b[x][y]*filter[xf][yf];                  
                }
              }
              
            }
          }
        }
      }
      
      this.colorMatrixToImageData(color.origin, imageData, filterW);
      //override color matrix
      this.color = color.origin;
      
    },
    
    applySobelFilter: function(imageData) {
      
      if(!this.isGrayScale) {
        this.convertGrayScale(imageData);
      }
      
      //filter
      var filterHx = [[-1,0,1],[-2,0,2],[-1,0,1]],
        filterHy = [[-1,-2,-1],[0,0,0],[1,2,1]];
      
      var filterHxW = filterHx.length,
        filterHyW = filterHy.length;
      
      var colorHx = this.imageDataToColorMatrix(imageData),
        colorHy = this.imageDataToColorMatrix(imageData);
      
      var color = [];

      var edge = [], edgeDir = [], rad = [];
      
      var w = imageData.width, h = imageData.height;
      
      //filter
      for(var x=0;x<w;x++) {
        edge[x] = [];
        edgeDir[x] = [];
        rad[x] = [];
        for(var y=0;y<h;y++) {
          
          //sobel filter
          for(var xf=0;xf<filterHxW;xf++) {
            for(var yf=0;yf<filterHxW;yf++) {
              
              var _xf= xf-parseInt(filterHxW/2-0.5),
                _yf= yf-parseInt(filterHxW/2-0.5);
              
              if((x+_xf) > -1 && (y+_yf) > -1 && (x+_xf) < w && (y+_yf) < h) {
                //colorHx
                colorHx.origin[x][y] += colorHx.copy[x+_xf][y+_yf]*filterHx[xf][yf];
                //colorHy
                colorHy.origin[x][y] += colorHy.copy[x+_xf][y+_yf]*filterHy[xf][yf];
              }
              
            }
          }
          
          //edge
          edge[x][y] = Math.sqrt(Math.abs(colorHx.origin[x][y] * colorHx.origin[x][y] - colorHy.origin[x][y]*colorHy.origin[x][y]));
          
          //edge dir
          rad[x][y] = Math.abs(Math.atan2(colorHy.origin[x][y] , colorHx.origin[x][y]))*180/Math.PI;
          if (0 < rad[x][y] && rad[x][y] <= 22.5) {
            // 0 deg
            edgeDir[x][y] = 0;
          } else if (22.5 < rad[x][y] && rad[x][y] <= 67.5) {
            // 45 deg
            edgeDir[x][y] = 45;
          } else if (67.5 < rad[x][y] && rad[x][y] <= 112.5) {
            // 90 deg
            edgeDir[x][y] = 90;
          } else if (112.5 < rad[x][y] && rad[x][y] <= 157.5){
            // 135 deg
            edgeDir[x][y] = 135;
          } else {
            // 0 deg
            edgeDir[x][y] = 0;
          }
          
        }
      }
      
      //detect edge
      for(var x=0;x<w;x++) {
        color[x] = [];
        
        for(var y=0;y<h;y++) {
          if((x-1) > -1 && (y-1) > -1 && (x+1) < w && (y+1) < h) {
            // 0 deg
            if(edgeDir[x][y] == 0) {
              if(edge[x][y]>edge[x][y-1] && edge[x][y]>edge[x][y+1]) {
                color[x][y] = edge[x][y];
              } else {
                color[x][y] = 0;
              }
            // 45 deg
            } else if(edgeDir[x][y] == 45) {
              if(edge[x][y]>edge[x-1][y-1] && edge[x][y]>edge[x+1][y+1]) {
                color[x][y] = edge[x][y];           
              } else {
                color[x][y] = 0;
              }
            // 90 deg
            } else if(edgeDir[x][y] == 90) {
              if(edge[x][y]>edge[x-1][y] && edge[x][y]>edge[x+1][y]) {
                color[x][y] = edge[x][y];
              } else {
                color[x][y] = 0;
              }
            // 135 deg
            } else if(edgeDir[x][y] == 135) {
              if(edge[x][y]>edge[x-1][y+1] && edge[x][y]>edge[x+1][y-1]) {
                color[x][y] = edge[x][y];
              } else {
                color[x][y] = 0;
              }
            }
          } else {
            color[x][y] = 0;
          }
        }
      }
      
      //this.colorMatrixToImageData(colorHx.origin, imageData, filterHxW);
      //this.colorMatrixToImageData(colorHy.origin, imageData, filterHxW);
      //this.colorMatrixToImageData(edge, imageData, filterHxW);      
      this.colorMatrixToImageData(color, imageData, 1);
      
      //override color matrix
      this.color = color;
      
      this.edge = edge;
      this.edgeDir = edgeDir;
      
    },
    
    hysteresisThreshold: function(imageData, heigh, low) {
      
      var color = this.color, edgeDir = this.edgeDir;
      
      var w = imageData.width, h = imageData.height;

      var isEdge = []; // edge flag matrix 1:edge, 0:noEdge, 2: middle
      
      //height, low, mid に分解
      for(var x=0;x<w;x++) {
        isEdge[x] = [];
        for(var y=0;y<h;y++) {
          if(color[x][y] > heigh) {
            isEdge[x][y] = 1;
          } else if(color[x][y] < low){
            isEdge[x][y] = 0;
          } else {
            isEdge[x][y] = 2;
          }
        }
      }
      
      var isEdgeCopy = this.copyArray2d(isEdge);
      
      //this.trackMiddle用に一旦解放
      this.isEdge = isEdge;
      this.isEdgeCopy = isEdgeCopy;
      this.w = w;
      this.h = h;
      this.edgeDir = edgeDir;
      
      //midを処理
      for(var x=0;x<w;x++) {
        for(var y=0;y<h;y++) {
                    
          if(isEdgeCopy[x][y] == 1) {
            if((x-1) > -1 && (y-1) > -1 && (x+1) < w && (y+1) < h) {
              // 0 deg
              if(edgeDir[x][y] == 0) {
                if(isEdgeCopy[x+1][y] == 2) {
                  //追跡開始
                  var storeTrackDataA = [];//edgeの追跡データを保存
                  this.trackMiddle(x,y,x+1,y,storeTrackDataA);
                }
                if(isEdgeCopy[x-1][y] == 2) {
                  //追跡開始
                  var storeTrackDataB = [];//edgeの追跡データを保存
                  this.trackMiddle(x,y,x-1,y,storeTrackDataB);
                }
              // 45 deg
              } else if(edgeDir[x][y] == 45) {
                if(isEdgeCopy[x+1][y-1] == 2) {
                  var storeTrackDataA = [];
                  this.trackMiddle(x,y,x+1,y-1,storeTrackDataA);
                }
                if(isEdgeCopy[x-1][y+1] == 2) {
                  var storeTrackDataB = [];
                  this.trackMiddle(x,y,x-1,y+1,storeTrackDataB);
                }
              // 90 deg
              } else if(edgeDir[x][y] == 90) {
                if(isEdgeCopy[x][y-1] == 2) {
                  var storeTrackDataA = [];
                  this.trackMiddle(x,y,x,y-1,storeTrackDataA);
                }
                if(isEdgeCopy[x][y+1] == 2) {
                  var storeTrackDataB = [];
                  this.trackMiddle(x,y,x,y+1,storeTrackDataB);
                }
              // 135 deg
              } else if(edgeDir[x][y] == 135) {
                if(isEdgeCopy[x-1][y-1] == 2) {
                  var storeTrackDataA = [];
                  this.trackMiddle(x,y,x-1,y-1,storeTrackDataA);
                }
                if(isEdgeCopy[x+1][y+1] == 2) {
                  var storeTrackDataB = [];
                  this.trackMiddle(x,y,x+1,y+1,storeTrackDataB);
                }
              }
              
            }
          }
          
        }
      }//for
      
      //isEdge→color
      for(var x=0;x<w;x++) {
        for(var y=0;y<h;y++) {
          if(isEdge[x][y] == 1) {
            color[x][y] = this.edgeHeighVal;
          } else {
            color[x][y] = this.edgeLowVal;
          }
        }
      }
      
      this.colorMatrixToImageData(color, imageData);
      
      //override color matrix
      this.color = color;

    },
    
    //only use hysteresisThreshold
    trackMiddle: function(beforeX,beforeY,afterX,afterY,storeTrackData) {
      
      var x = afterX, y = afterY, _x = beforeX, _y = beforeY;
      
      if((x-1) > -1 && (y-1) > -1 && (x+1) < this.w && (y+1) < this.h) {
          // 0 deg
          if(this.edgeDir[x][y] == 0) {
            if( _x != x+1 && _y != y) {
              if(this.isEdgeCopy[x+1][y] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x+1,y,storeTrackData);
              } else if(this.isEdgeCopy[x+1][y] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x-1 && _y != y) {
              if(this.isEdgeCopy[x-1][y] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x-1,y,storeTrackData);
              } else if(this.isEdgeCopy[x-1][y] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
          // 45 deg
          } else if(this.edgeDir[x][y] == 45) {
            if( _x != x+1 && _y != y-1) {
              if(this.isEdgeCopy[x+1][y-1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x+1,y-1,storeTrackData);
              } else if(this.isEdgeCopy[x+1][y-1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x-1 && _y != y+1) {
              if(this.isEdgeCopy[x-1][y+1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x-1,y+1,storeTrackData);
              } else if(this.isEdgeCopy[x-1][y+1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
          // 90 deg
          } else if(this.edgeDir[x][y] == 90) {
            if( _x != x && _y != y-1) {
              if(this.isEdgeCopy[x][y-1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x,y-1,storeTrackData);
              } else if(this.isEdgeCopy[x][y-1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x && _y != y+1) {
              if(this.isEdgeCopy[x][y+1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x,y+1,storeTrackData);
              } else if(this.isEdgeCopy[x][y+1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            
          // 135 deg
          } else if(this.edgeDir[x][y] == 135) {
            if( _x != x-1 && _y != y-1) {
              if(this.isEdgeCopy[x-1][y-1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x-1,y-1,storeTrackData);
              } else if(this.isEdgeCopy[x-1][y-1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            if( _x != x+1 && _y != y+1) {
              if(this.isEdgeCopy[x+1][y+1] == 2) {
                storeTrackData.push({x:x, y:y});
                this.trackMiddle(x,y,x+1,y+1,storeTrackData);
              } else if(this.isEdgeCopy[x+1][y+1] == 1) {
                this.drawLine(storeTrackData, 1);
              } else {
                this.drawLine(storeTrackData, 0);
              }
            }
            
          }
        } else {
          this.drawLine(storeTrackData, 1);
        }

    },
    
    //only use hysteresisThreshold
    drawLine: function(storeTrackData, edgeVal) {

      for(var i = 0, l = storeTrackData.length; i < l; i++) {
        if(edgeVal == 1) {
          this.edge[storeTrackData[i].x, storeTrackData[i].y] = 1;          
        } else {
          this.edge[storeTrackData[i].x, storeTrackData[i].y] = 0;
        }
      }

    },
    
    imageDataToColorMatrix: function(imageData, isGrayScale) {
      
      var data = imageData.data, pixels = data.length/4, 
        w = imageData.width, h = imageData.height;

      isGrayScale = isGrayScale || this.isGrayScale;
    
      if(isGrayScale) {
        //color matrix
        var color = [],
          colorCopy = [];
        
        //imageData→color matrix
        for(var x=0;x<w;x++) {
          color[x] = []; 
          colorCopy[x] = [];
          for(var y=0;y<h;y++) {
            color[x][y] = data[(x + (y*w)) * 4 ];
            colorCopy[x][y] = data[(x + (y*w)) * 4];
          }
        }
      } else {
        //color matrix
        var color = {r:[],g:[],b:[]},
          colorCopy = {r:[],g:[],b:[]};
        
        //imageData→color matrix
        for(var x=0; x<w; x++) {
          color.r[x] = []; color.g[x] = []; color.b[x] = [];
          colorCopy.r[x] = []; colorCopy.g[x] = []; colorCopy.b[x] = []; 
          for(var y=0;y<h;y++) {
            color.r[x][y] = data[(x + (y*w)) * 4 ];
            color.g[x][y] = data[(x + (y*w)) * 4 + 1];
            color.b[x][y] = data[(x + (y*w)) * 4 + 2];
            colorCopy.r[x][y] = data[(x + (y*w)) * 4 ];
            colorCopy.g[x][y] = data[(x + (y*w)) * 4 + 1];
            colorCopy.b[x][y] = data[(x + (y*w)) * 4 + 2];
          }
        }
      }

      return {origin: color, copy: colorCopy};

    },
    
    colorMatrixToImageData: function(color, imageData, filterW, isGrayScale) {
      
      var data = imageData.data, pixels = data.length/4, 
        w = imageData.width, h = imageData.height;
      
      filterW = filterW || 1;
      isGrayScale = isGrayScale || this.isGrayScale;

      if(this.isGrayScale) {
        //color matrix→imageData
        for(var i=0,l=pixels; i<l; i++) {
          var x = i%w, y = parseInt(i/w);        
          data[i*4] = color[x][y]/filterW;
          data[i*4+1] = color[x][y]/filterW;
          data[i*4+2] = color[x][y]/filterW;
        }
      } else {
        //color matrix→imageData
        for(var i=0,l=pixels; i<l; i++) {
          var x = i%w, y = parseInt(i/w);        
          data[i*4] = color.r[x][y]/filterW;
          data[i*4+1] = color.g[x][y]/filterW;
          data[i*4+2] = color.b[x][y]/filterW;
        }
      }

    },
    
    copyArray2d: function(arr) {
      var rArr = [];
      
      var w = arr.length, h = arr[0].length;
      
      for(var x = 0; x < w; x++) {
        rArr[x] = [];
        for(var y = 0; y < h; y++) {
          rArr[x][y] = arr[x][y];
        } 
      }
      
      return rArr;
    }
  
  }

  _l.media.cannyedge = function(options) {
    return new CannyEdgeDetecotor(options);
  }
  
})(document, window);
