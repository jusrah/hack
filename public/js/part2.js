/*globals asset_owners_to_entries asset_to_entries sort_reversed detailAssetSellBuyValInput detailAssetSellBuyQtyInput detailAssetSellBuyButton createRow asset_forsale_to_entries detailAssetButton sort_assets sort_selected*/
/*eslint-env browser */
/* global clear_blocks */
/* global formatMoney */
/* global in_array */
/* global new_block */
/* global formatDate */
/* global nDig */
/* global randStr */
/* global bag */
/* global $ */
var ws = {};
var user = {
    username: bag.session.username,
    name: bag.session.name,
    role: bag.session.role
};
var panels = [
    {
        name: "trade",
        formID: "tradeFilter",
        tableID: "#tradesBody",
        filterPrefix: "trade_"
    },
    {
        name: "audit",
        formID: "auditFilter",
        tableID: "#auditBody",
        filterPrefix: "audit_"
    }
];

//EY <-----------------
var mUrlType = {
	WEB: "web",
	IMG: "img"
};
var mAssetStatus = {
	PENDING:	"Pending",
	APPROVED: 	"Approved",
	LOCKED:		"Locked"
};

var mPanelIdx = {
	wallet: 0,
	buy: 1,
	approve: 2,
	walletAsset: 0,
	buyAsset: 1,
	approveAsset: 2
};
var asset_panels = [
    {
        name: "wallet",
        formID: "walletFilter",
        tableID: "#walletsBody",
        filterPrefix: "wallet_",
        sort_selected: sort_assets.date,
        sort_reversed: true,
        filter: {}
    },
    {
        name: "buy",
        formID: "buyFilter",
        tableID: "#buysBody",
        filterPrefix: "buy_",
        sort_selected: sort_assets.date,
        sort_reversed: true,
        filter: {}
    },
    {
        name: "approve",
        formID: "approveFilter",
        tableID: "#approvesBody",
        filterPrefix: "approve_",
        sort_selected: sort_assets.date,
        sort_reversed: true,
        filter: {}
    }
];
var asset_detail_panels = [
    {
        name: "walletAsset",
        formID: "walletAssetFilter",
        tableID: "#walletAssetBody",
        filterPrefix: "walletAsset_"
    },
    {
        name: "buyAsset",
        formID: "buyFilter",
        tableID: "#buyAssetBody",
        filterPrefix: "buyAsset_"
    },
    {
        name: "approveAsset",
        formID: "approveAssetFilter",
        tableID: "#approveAssetBody",
        filterPrefix: "approveAsset_"
    }
];
//EY ------------------>

// =================================================================================
// On Load
// =================================================================================
$(document).on('ready', function () {
    connect_to_server();
    if (user.name) $("#userField").html(user.name.toUpperCase() + ' ');

    // Customize which panels show up for which user
    $(".nav").hide();
    console.log("user role", bag.session.user_role);

    // Only show tabs if a user is logged in
    if (user.username) {

        // Display tabs based on user's role
        if (user.role && user.role.toUpperCase() === "approver".toUpperCase()) {
            $("#approveLink").show(); //EY
            
        } else if (user.username) {
            $("#createassetLink").show(); 	//EY
			$("#walletLink").show();			//EY
			$("#buyLink").show();			//EY
        }
    } else {

        // Display the login and user registration links
        $("#loginLink").show();
        $("#registerLink").show();
    }

    // =================================================================================
    // jQuery UI Events
    // =================================================================================
    $("#submit").click(function () {
        if (user.username) {
            var obj = {
                type: "create",
                paper: {
                    ticker: escapeHtml($("input[name='ticker']").val()),
                    par: Number($("select[name='par']").val()),
                    qty: Number($("select[name='qty']").val()),
                    discount: Number($("select[name='discount']").val()),
                    maturity: Number($("select[name='maturity']").val()),
                    owner: [],
                    issuer: user.name,
                    issueDate: Date.now().toString()
                },
                user: user.username
            };
            if (obj.paper && obj.paper.ticker) {
                obj.paper.ticker = obj.paper.ticker.toUpperCase();
                console.log('creating paper, sending', obj);
                ws.send(JSON.stringify(obj));
                $(".panel").hide();
                $("#tradePanel").show();
            }
        }
        return false;
    });
    
    //EY <--------------------------------------------------------------------------
    //Create new property
    $("#submitasset").click(function () {
    	
        if (user.username) {
        	
        	var sId  	  = user.name + Date.now().toString() + randStr(10);
        	var nQty 	  = Number($("input[name='qty']").val());
        	var fMktValue = Number($("input[name='mktValue']").val());
        	var sName 	  = escapeHtml($("input[name='name']").val()).trim();
        	var aUrlLinks = [];
        	
        	//Quantity/Value validations
        	if (fMktValue <= 0) {
        		showErrorMessage("Market Value must be greater than zero");
        		return;
        	}
        	if (nQty <= 0) {
        		showErrorMessage("Quantity must be greater than zero");
        		return;
        	}
        	//Dont allow quantity to be greater than value to avoid small amount fractions
        	if (nQty > fMktValue) {
        		showErrorMessage("Quantity cannot be greater than Market Value");
        		return;
        	}
        	//Property name is mandatory
        	if (!sName || sName === "") {
        		showErrorMessage("Name is a mandatory parameter");
        		return;
        	}
        	//Url Links
        	var sUrl = escapeHtml($("input[name='urlWeb']").val()).trim();
        	if (sUrl) {
        		var oUrlLink = {url: "", urlType: ""};
        		oUrlLink.url = sUrl;
        		oUrlLink.urlType = mUrlType.WEB;
        		aUrlLinks.push(oUrlLink);
        	}
        	var aInpImgUrl = $(".inpImgUrl");
        	for (var i=0; i<aInpImgUrl.length;i++) {
        		
        		sUrl = escapeHtml(aInpImgUrl[i].value).trim();
        		if (sUrl) {
        			var oUrlLink = {url: "", urlType: ""}; //objects are being assigned by reference, create new object intentially 
	        		oUrlLink.url = sUrl;
	        		oUrlLink.urlType = mUrlType.IMG;
	        		aUrlLinks.push(oUrlLink);
	        	}
        	}
        	
        	//PRepare asset object
            var obj = {
                type: "createasset",
                asset: {
                	cusip:		 sId.toUpperCase(),
					name:		 sName,
				    adrStreet:   escapeHtml($("input[name='adrStreet']").val()),
				    adrCity:     escapeHtml($("input[name='adrCity']").val()),
				    adrPostcode: escapeHtml($("input[name='adrPostcode']").val()),
				    adrState:    escapeHtml($("select[name='adrState']").val()),
				    quantity:    nQty, 
				    mktval:      fMktValue,
				    status:		 mAssetStatus.PENDING,
				    buyval:      fMktValue,
				    owner:       [], //The owner is being added on chaincode side
				    forsale:     [],
				    urlLink:	 aUrlLinks,		       
				    issuer:      user.name,
                    issueDate:   Date.now().toString()
                },
                user: user.username
            };
            //Submit a new asset object to blockchain
            if (obj.asset && obj.asset.name) {
                obj.asset.name = obj.asset.name.toUpperCase();
                console.log('creating asset, sending', obj);
                ws.send(JSON.stringify(obj));
                $(".panel").hide();
                $("#walletPanel").show();
            }
        }
        return false;
    });
    
    //Update Market Value
    $("#submitMktValue").click(function () {
    	
        if (user.username) {
        	
        	var sCusip = $(this).attr('data_cusip');
        	if (!sCusip) {
        		showErrorMessage("Asset ID cannot be identified. Try to refresh");
        		return;
        	}
        	var nMktValOld = Number($(this).attr('data_mktval'));
        	var nMktValNew = Number($("input[name='approveAsset-mktValueUpd']").val());
        	//Validations
        	if (nMktValOld === nMktValNew) { //updating status as well
        		//showErrorMessage("The market value is not changed. Nothing to update");
        		//return;
        	}
        	if (nMktValNew <= 0 || isNaN(nMktValNew)) {
        		showErrorMessage("The market value cannot be zero or negative");
        		return;
        	}
			//Prepare the object
            var obj = {
                type: "update_mktval",
                update: {
					cusip:	sCusip,
				    mktval:	nMktValNew,
				    status:	mAssetStatus.APPROVED
                },
                user: user.username
            };
            //Send the object
            if (obj.update.cusip && obj.update.mktval) {
                console.log('update market value, sending', obj);
                ws.send(JSON.stringify(obj));
                $(".panel").hide();
                $("#approvePanel").show();
            }
        }
        return false;
    });
    
    //Add additional input control for image url
    $(document).on("click", ".btnAddImgUrl", function () {
    	
		//Get parent legend control
		var $Parent = $("#groupImgUrl");
		var oParent = $Parent.get(0);
		
		//Creating the screen elements
		var oLegend = document.createElement('legend');
		
		var oInput = document.createElement('input');
		oInput.classList.add('inpImgUrl');
		oInput.setAttribute('type', 'url');
		oInput.setAttribute('urlType', 'img');

		var oSpan = document.createElement('span');
    	oSpan.classList.add('hint');
   		oSpan.innerHTML = 'IMAGE URL';
   		
		//var oButton = document.createElement('button');
		//oButton.setAttribute('type', 'button');
		//oButton.classList.add('btnAddImgUrl');
		
		var oBtnSpan = document.createElement('span:a');
		oBtnSpan.classList.add('fa');
		oBtnSpan.classList.add('fa-plus');
		oBtnSpan.classList.add('btnAddImgUrl');
		
		//Removing a previuos add image url <span:a> element from the screen
		$('span\\:a').remove(".btnAddImgUrl");
		
		//Putting all together
		oSpan.appendChild(oBtnSpan);
		oLegend.appendChild(oInput);
		oLegend.appendChild(oSpan);
		oParent.appendChild(oLegend);
		
    	return;

    });
    
    //Show images
    $(document).on("click", ".btnShowImg", function () {
    	
    	// Get the modal
		var oModal = document.getElementById($(this).attr('modal_id'));
		if (!oModal) return;
    	
    	//Remove all image elements
    	$('img').remove(".modalImg-content");
    	//Get CUSIP of selected asset
    	var sCusip = $(this).attr('cusip');
    	var aUrlLinks = [];
    	//Read related asset data
    	if (sCusip) {
			for (var i in bag.assets) {
				if (bag.assets[i].cusip === sCusip) {
					aUrlLinks = bag.assets[i].urlLink;
					break;
				}
			}
		}
		//Create image elements
		var bShowModal = false;
    	for (var i = 0; i < aUrlLinks.length; i++) {
    		if (aUrlLinks[i].url && aUrlLinks[i].urlType === mUrlType.IMG) {
    			var oImg = document.createElement('img');
    			oImg.classList.add('modalImg-content');
    			oImg.src = aUrlLinks[i].url;
    			oModal.appendChild(oImg);
    			bShowModal = true;
    		}
    	}		
		// When the user clicks the button, open the modal 
		if (bShowModal) oModal.style.display = "block";
    });    
    //Close images modal window 
    function closeAssetImgModal (sModalId) {
    	
    	// Get the modal
		var oModal = document.getElementById(sModalId);
		// When the user clicks on <span> (x), close the modal 
		if (oModal) {
			oModal.style.display = "none";
		}   
    };
    $(document).on("click", ".modalImg-close", function () {
    	closeAssetImgModal($(this).attr('modal_id'));  	
    });     
	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(oEvent) {
		
		// Get the modal
	    if (oEvent && oEvent.target && oEvent.target.className === "modalImg") {
	        oEvent.target.style.display = "none"; 
	    }
	};   
    
    //Go to the website
    $(document).on("click", ".btnGo2Web", function () {
    	
    	var urlLink = $(this).attr('urlLink');
    	if (urlLink) {
    		window.open(urlLink); 
		}
    });
    
    //walletAssetSell
    $(document).on("click", ".walletAssetSell", function () {
    	
        if (user.username) {
        	
        	//Get related data from button params
        	var sCusip = $(this).attr('data_cusip');
        	var sInvId = $(this).attr('data_invid');
        	var sStatus = $(this).attr('data_status');
        	
        	if (sStatus !== mAssetStatus.APPROVED) {
        		showErrorMessage("Asset has not been approved yet. You cannot sell it");
        		return;
        	}
        	
        	var nQuantity = $(this).attr('data_quantity');
        	var sQtyInputName = "input[name='" + $(this).attr('input_name') + "']";
        	var sValInputName = "input[name='" + $(sQtyInputName).attr("val_input_name") + "']";
        	var nQtyForSale = Number($(sQtyInputName).val());
        	var nValForSale = Number($(sValInputName).val());
        	
        	if (!nQtyForSale || nQtyForSale <= 0 || nQtyForSale > nQuantity) {
        		showErrorMessage("Quantity to sell must be integer number beetween 1 and " + nQuantity + " inclusive");
        		return;
        	}
        	if (!nValForSale || nValForSale <= 0) {
        		showErrorMessage("Value to sell must be greater than 0");
        		return;
        	}
        	var nRemainder = nQtyForSale % 1;
        	if (nRemainder !== 0) {
        		showErrorMessage("Quantity to sell must be integer number. Fractional quantity is not supported");
        		return;
        	}
        	if (user.name !== sInvId) {
        		showErrorMessage("You can't sell property not belonging to you");
        		return;
        	}

			var nValForSalePerToken = nValForSale / nQtyForSale; //TODO: avoid value lost during rounding
            var obj = {
                type: "set_asset_forsale",
                forsale: {
					cusip:		 sCusip,
					fromCompany: sInvId,
				    quantity:    nQtyForSale,
				    sellval:	 nValForSalePerToken
                },
                user: user.username
            };
            if (obj.forsale && obj.forsale.cusip) {
                console.log('set asset for sale, sending', obj);
                ws.send(JSON.stringify(obj));
                $(".panel").hide();
                $("#walletPanel").show();
            }
        }
        //return false;
    });
    
    //forsaleAssetBuy
    $(document).on("click", ".forsaleAssetBuy", function () {
    	
        if (user.username) {
        	
        	//Get related data from button params
        	var sCusip = $(this).attr('data_cusip');
        	var sInvId = $(this).attr('data_invid');
        	var nQuantity = $(this).attr('data_quantity');
        	var sStatus = $(this).attr('data_status');
        	
        	if (sStatus !== mAssetStatus.APPROVED) {
        		showErrorMessage("Asset has not been approved yet. You cannot buy it");
        		return;
        	}
        	
        	var sInputName = "input[name='" + $(this).attr('input_name') + "']";
        	var nQtyToBuy = Number($(sInputName).val());
        	if (!nQtyToBuy || nQtyToBuy <= 0 || nQtyToBuy > nQuantity) {
        		showErrorMessage("Quantity to buy must be integer number beetween 1 and " + nQuantity + " inclusive");
        		return;
        	}
        	var nRemainder = nQtyToBuy % 1;
        	if (nRemainder !== 0) {
        		showErrorMessage("Quantity to buy must be integer number. Fractional quantity is not supported");
        		return;
        	}
        	if (user.name === sInvId) {
        		showErrorMessage("You can't buy property owned by you");
        		return;
        	}

            var obj = {
                type: "transfer_asset",
                transfer: {
					cusip:		 sCusip,
					fromCompany: sInvId,
					toCompany:	 user.name,
				    quantity:    nQtyToBuy
                },
                user: user.username
            };
            if (obj.transfer && obj.transfer.cusip) {
                console.log('transfer asset, sending', obj);
                ws.send(JSON.stringify(obj));
                $(".panel").hide();
                $("#walletPanel").show();
            }
        }
       // return false;
    });
    
    //Process change event of Qty Sell/Buy input controller
    $(document).on("keyup change", ".detailAssetSellBuyQtyInput", function () {
    	
        if (user.username) {
        	
        	//Get related data from input params
        	var valInputName =  "input[name='" + $(this).attr('val_input_name') + "']";
        	var qtyTotal = $(this).attr('data_quantity');
        	var valTotal = Number($(this).attr('data_mktval'));
        	
        	//Get entered quantity
			var qtyEntered = Number($(this).val()); 
        	if (!qtyEntered || isNaN(qtyEntered) || qtyEntered < 0) {
        		qtyEntered = 0;
        	}
        	
        	//Get value input control
        	var oValInput = $(valInputName);
        	//Set calculated value
        	var nCalcVal = 0.00;
        	if (oValInput) {
        		var inpType = oValInput.attr("type");
        		nCalcVal = valTotal / qtyTotal * qtyEntered;
        		if (inpType === "text") 
        			oValInput.val(formatMoney(nCalcVal));
    			else
    				oValInput.val(nCalcVal);
        	}
        }
        //return false;
    });    
    
    //
     //forsaleAssetRevoke
    $(document).on("click", ".forsaleAssetRevoke", function () {
    	
        if (user.username) {
        	
        	//Get related data from button params
        	var sCusip = $(this).attr('data_cusip');
        	var sInvId = $(this).attr('data_invid');
        	var nQuantity = $(this).attr('data_quantity');
        	var sInputName = "input[name='" + $(this).attr('input_name') + "']";
        	var nQtyToBuy = Number($(sInputName).val());
        	if (!nQtyToBuy || nQtyToBuy <= 0 || nQtyToBuy > nQuantity) {
        		showErrorMessage("Quantity to revoke must be integer number beetween 1 and " + nQuantity + " inclusive");
        		return;
        	}
        	var nRemainder = nQtyToBuy % 1;
        	if (nRemainder !== 0) {
        		showErrorMessage("Quantity to revoke must be integer number. Fractional quantity is not supported");
        		return;
        	}
        	if (user.name !== sInvId) {
        		showErrorMessage("You can't revoke property owned by others");
        		return;
        	}

            var obj = {
                type: "transfer_asset",
                transfer: {
					cusip:		 sCusip,
					fromCompany: sInvId,
					toCompany:	 user.name,
				    quantity:    nQtyToBuy
                },
                user: user.username
            };
            if (obj.transfer && obj.transfer.cusip) {
                console.log('transfer asset, sending', obj);
                ws.send(JSON.stringify(obj));
                $(".panel").hide();
                $("#walletPanel").show();
            }
        }
        //return false;
    });  
    
    //EY -------------------------------------------------------------------------->
    
    $("#createLink").click(function () {
        $("input[name='name']").val('r' + randStr(6));
    });

    $("#tradeLink").click(function () {
        ws.send(JSON.stringify({type: "get_open_trades", v: 2, user: user.username}));
    });

    //login events
    $("#whoAmI").click(function () {													//drop down for login
        if ($("#loginWrap").is(":visible")) {
            $("#loginWrap").fadeOut();
        }
        else {
            $("#loginWrap").fadeIn();
        }
    });

    // Filter the assets whenever the filter modal changes
    //EY <-
    $(".wallet-filter").keyup(function () {
        "use strict";
        console.log("Change in wallet filter detected.");
        processFilterForm(asset_panels[mPanelIdx.wallet]);
    });
    $(".buy-filter").keyup(function () {
        "use strict";
        console.log("Change in buy filter detected.");
        processFilterForm(asset_panels[mPanelIdx.buy]);
    });
    $(".approve-filter").keyup(function () {
        "use strict";
        console.log("Change in approve filter detected.");
        processFilterForm(asset_panels[mPanelIdx.approve]);
    });
    //EY ->

    // Click events for the columns of the table
    $('.sort-selector').click(function () {
        "use strict";
        var sort = $(this).attr('sort');
        var sPanelName = $(this).attr('panel');

        // Clear any sort direction arrows
        var sSortIndicatorClass = sPanelName + "-sort-indicator";
        $('span').remove("." + sSortIndicatorClass);

        // Clicking the column again should reverse the sort
        if(sort_assets[sort] === asset_panels[mPanelIdx[sPanelName]].sort_selected) {
            console.log("Reversing the table");
            asset_panels[mPanelIdx[sPanelName]].sort_reversed = !asset_panels[mPanelIdx[sPanelName]].sort_reversed;
        }
        else asset_panels[mPanelIdx[sPanelName]].sort_reversed = false;

        // Add the appropriate arrow to the current selector
        var arrow_icon = asset_panels[mPanelIdx[sPanelName]].sort_reversed ? 'fa-arrow-up' : 'fa-arrow-down';
        var span = document.createElement('span');
        span.classList.add('fa');
        span.classList.add(arrow_icon);
        span.classList.add(sSortIndicatorClass);
        $(this).append(span);

        // Change to the sort corresponding to that column
        asset_panels[mPanelIdx[sPanelName]].sort_selected = sort_assets[sort];
        console.log("Sorting by:", sort);
        //EY <-
        //Build assets for the corresponding panel only
       	if (sPanelName) build_assets(bag.assets, asset_panels[mPanelIdx[sPanelName]]);
        //EY ->
    });

    //trade events
    $(document).on("click", ".buyPaper", function () {
        if (user.username) {
            console.log('trading...');
            var i = $(this).attr('trade_pos');
            var cusip = $(this).attr('data_cusip');
            var issuer = $(this).attr('data_issuer');

            // TODO Map the trade_pos to the correct button
            var msg = {
                type: 'transfer_paper',
                transfer: {
                    //CUSIP: bag.papers[i].cusip,
                    //fromCompany: bag.papers[i].issuer,
                    CUSIP: cusip,
                    fromCompany: issuer,
                    toCompany: user.name,
                    quantity: 1
                },
                user: user.username
            };
            console.log('sending', msg);
            ws.send(JSON.stringify(msg));
            $("#notificationPanel").animate({width: 'toggle'});
        }
    });
    
     //EY <------------------------------------------------ 
     //View Wallet Asset Details
    $(document).on("click", ".detailWalletAsset", function () {
        if (user.username) {
        	closeAssetImgModal(); 
            console.log('wallet asset details...');
			showDetailPanel("walletasset");
			//Build data
			var sCusip = $(this).attr('data_cusip');
			if (sCusip) {
				for (var i in bag.assets) {
				
					if (bag.assets[i].cusip === sCusip) {
						build_asset_details(bag.assets[i], asset_detail_panels[mPanelIdx.walletAsset]);	
						return;
					}

				}
			}
        }
    });
    //View Asset Details for Approval
    $(document).on("click", ".detailApproveAsset", function () {
        if (user.username) {
        	closeAssetImgModal();
            console.log('approve asset details...');
			showDetailPanel("approveasset");
			//Build data
			var sCusip = $(this).attr('data_cusip');
			if (sCusip) {
				for (var i in bag.assets) {
				
					if (bag.assets[i].cusip === sCusip) {
						build_asset_details(bag.assets[i], asset_detail_panels[mPanelIdx.approveAsset]);	
						return;
					}

				}
			}
        }
    });
    //View For Sale Asset Details
    $(document).on("click", ".detailForSaleAsset", function () {
        if (user.username) {
        	closeAssetImgModal();
            console.log('for sale asset details...');
			showDetailPanel("buyasset");
			//Build data
			var sCusip = $(this).attr('data_cusip');
			if (sCusip) {
				for (var i in bag.assets) {
				
					if (bag.assets[i].cusip === sCusip) {
						build_asset_details(bag.assets[i], asset_detail_panels[mPanelIdx.buyAsset]);	
						return;
					}

				}
			}
        }
    });
    //EY -------------------------------------------->
});

// =================================================================================
// Helper Fun
// =================================================================================
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// =================================================================================
// Socket Stuff
// =================================================================================
function connect_to_server() {
    var connected = false;
    connect();

    function connect() {
        var wsUri = '';
        console.log('protocol', window.location.protocol);
        if (window.location.protocol === 'https:') {
            wsUri = "wss://" + bag.setup.SERVER.EXTURI;
        }
        else {
            wsUri = "ws://" + bag.setup.SERVER.EXTURI;
        }

        ws = new WebSocket(wsUri);
        ws.onopen = function (evt) {
            onOpen(evt);
        };
        ws.onclose = function (evt) {
            onClose(evt);
        };
        ws.onmessage = function (evt) {
            onMessage(evt);
        };
        ws.onerror = function (evt) {
            onError(evt);
        };
    }

    function onOpen(evt) {
        console.log("WS CONNECTED");
        connected = true;
        clear_blocks();
        $("#errorNotificationPanel").fadeOut();
        ws.send(JSON.stringify({type: "chainstats", v: 2, user: user.username}));
        //ws.send(JSON.stringify({type: "get_papers", v: 2, user: user.username}));
        
        //EY <-
        $("#customErrorNotificationPanel").fadeOut();
        ws.send(JSON.stringify({type: "get_assets", v: 2, user: user.username}));
        //EY ->
        
        if (user.name && user.role !== "approver") {
            ws.send(JSON.stringify({type: 'get_company', company: user.name, user: user.username}));
        }
    }

    function onClose(evt) {
        console.log("WS DISCONNECTED", evt);
        connected = false;
        setTimeout(function () {
            connect();
        }, 5000);					//try again one more time, server restarts are quick
    }

	function onMessage(msg) {
		try {
			var data = JSON.parse(msg.data);
			console.log('rec', data);
			if (data.msg === 'papers') {
				try{
					var papers = JSON.parse(data.papers);
					//console.log('!', papers);
					if ($('#auditPanel').is){
						for (var i in panels) {
							build_trades(papers, panels[i]);
						}
					}
				}
				catch(e){
					console.log('cannot parse papers', e);
				}
			}
			//EY <-
			else if (data.msg === 'assets') {
				try{
					bag.assets = extendAssets(JSON.parse(data.assets));
					for (var i in asset_panels) {
						build_assets(bag.assets, asset_panels[i]);
					}
				}
				catch(e){
					console.log('cannot parse assets', e);
				}
			}
			//EY ->
			else if (data.msg === 'chainstats') {
				//console.log(JSON.stringify(data));
				var e = formatDate(data.blockstats.transactions[0].timestamp.seconds * 1000, '%M/%d/%Y &nbsp;%I:%m%P');
				$("#blockdate").html('<span style="color:#fff">TIME</span>&nbsp;&nbsp;' + e + ' UTC');
				var temp = {
					id: data.blockstats.height,
					blockstats: data.blockstats
				};
				new_block(temp);									//send to blockchain.js
			}
			else if (data.msg === 'company') {
				console.log("woo i'm here, lets set some account balances");
				try{
					var company = JSON.parse(data.company);
					console.log("Account balance is: ", company.cashBalance);
					$("#accountBalance1").html(formatMoney(company.cashBalance));
					$("#accountBalance2").html(formatMoney(company.cashBalance));
					$("#accountBalance").html(formatMoney(company.cashBalance));
					console.log("Set account balance");
				}
				catch(e){
					console.log('cannot parse company', e);
				}
			}
			else if (data.msg === 'reset') {
				// Ask for all available trades and information for the current company
				//ws.send(JSON.stringify({type: "get_papers", v: 2, user: user.username}));
				ws.send(JSON.stringify({type: "get_assets", v: 2, user: user.username})); //EY
				if (user.role !== "approver") {
					ws.send(JSON.stringify({type: 'get_company', company: user.name, user: user.username}));
				}
			}
			else if (data.type === 'error') {
				console.log("Error:", data.error);
			}
		}
		catch (e) {
			console.log('ERROR', e);
			//ws.close();
		}
	}

    function onError(evt) {
        console.log('ERROR ', evt);
        if (!connected && bag.e == null) {											//don't overwrite an error message
            $("#errorName").html("Warning");
            $("#errorNoticeText").html("Waiting on the node server to open up so we can talk to the blockchain. ");
            $("#errorNoticeText").append("This app is likely still starting up. ");
            $("#errorNoticeText").append("Check the server logs if this message does not go away in 1 minute. ");
            $("#errorNotificationPanel").fadeIn();
        }
    }

    function sendMessage(message) {
        console.log("SENT: " + message);
        ws.send(message);
    }
}


// =================================================================================
//	UI Building
// =================================================================================
/**
 * Process the list of trades from the server and displays them in the trade list.
 * This function builds the tables for multiple panels, so an object is needed to
 * identify which table it should be drawing to.
 * @param papers The list of trades to display.
 * @param panelDesc An object describing what panel the trades are being shown in.
 */
function build_trades(papers, panelDesc) {

    if(!user.name)
    bag.papers = papers;						//store the trades for posterity
    //console.log('papers:', bag.papers);

    if(papers && papers.length > 0) {

        // Break the papers down into entries
        console.log('breaking papers into individual entries');
        var entries = [];
        for (var paper in papers) {
            var broken_up = paper_to_entries(papers[paper]);
            entries = entries.concat(broken_up);
        }
        console.log("Displaying", papers.length, "papers as", entries.length, "entries");

        // If no panel is given, assume this is the trade panel
        if (!panelDesc) {
            panelDesc = panels[0];
        }

        entries.sort(sort_selected);
        if (sort_reversed) entries.reverse();

        // Display each entry as a row in the table
        var rows = [];
        for (var i in entries) {
            console.log('!', entries[i]);

            if (entries[i].quantity > 0) {													//cannot buy when there are none

                if (excluded(entries[i], panelDesc.filter)) {
                    var style;
                    if (user.name.toLowerCase() === entries[i].owner.toLowerCase()) {
                        //cannot buy my own stuff
                        style = 'invalid';
                    }
                    else if (entries[i].issuer.toLowerCase() !== entries[i].owner.toLowerCase()) {
                        //cannot buy stuff already bought
                        style = 'invalid';
                    } else {
                        style = null;
                    }
                    
                    // Create a row for each valid trade
                    var data = [
                        formatDate(Number(entries[i].issueDate), '%M/%d %I:%m%P'),
                        entries[i].cusip,
                        escapeHtml(entries[i].ticker.toUpperCase()),
                        formatMoney(entries[i].par),
                        entries[i].quantity,
                        entries[i].discount,
                        entries[i].maturity,
                        entries[i].issuer,
                        entries[i].owner
                    ];

                    var row = createRow(data);
                    style && row.classList.add(style);

                    // Only the trade panel should allow you to interact with trades
                    if (panelDesc.name === "trade") {
                        var disabled = false
                        if (user.name.toLowerCase() === entries[i].owner.toLowerCase()) disabled = true;			//cannot buy my own stuff
                        if (entries[i].issuer.toLowerCase() !== entries[i].owner.toLowerCase()) disabled = true;
                        var button = buyButton(disabled, entries[i].cusip, entries[i].issuer);
                        row.appendChild(button);
                    }
                    rows.push(row);
                }
            }

        }

        // Placeholder for an empty table
        var html = '';
        if (rows.length == 0) {
            if (panelDesc.name === 'trade')
                html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
            else if (panelDesc.name === 'audit')
                html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'; // No action column
            $(panelDesc.tableID).html(html);
        } else {
            // Remove the existing table data
            console.log("clearing existing table data");
            var tableBody = $(panelDesc.tableID);
            tableBody.empty();


            // Add the new rows to the table
            console.log("populating new table data");
            var row;
            while (rows.length > 0) {
                row = rows.shift();
                tableBody.append(row);
            }
        }
    } else {
        if (panelDesc.name === 'trade')
            html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
        else if (panelDesc.name === 'audit')
            html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>'; // No action column
        $(panelDesc.tableID).html(html);
    }
}

//EY <----------------------------------------------------------------------------

/**
 * Extend Asset objects with additional data (like market value per owner)
 */
function extendAssets(aAssets) {
	
	var aAssetExt = aAssets;
	if (!aAssets) {
		aAssetExt = [];
	}
	var fValRemainder = 0.00;
	var nQtyRemainder = 0;
	//Process assets received from blockchain
	for (var i=0; i < aAssetExt.length; i++) {
		
		//New attr: market value per token
		aAssetExt[i].mktvalPerToken = aAssetExt[i].mktval / aAssetExt[i].quantity;
		
		//Remainders: used to avoid any discrepancy during rounding
		fValRemainder = aAssetExt[i].mktval;
		nQtyRemainder = aAssetExt[i].quantity;
		
		//Process subsets per owner
		for (var j=0; j < aAssetExt[i].owner.length; j++) {
			//New attr: total market value per owner
			aAssetExt[i].owner[j].mktval = aAssetExt[i].mktvalPerToken * aAssetExt[i].owner[j].quantity;
			//last division subset
			if (nQtyRemainder === aAssetExt[i].owner[j].quantity) {
				aAssetExt[i].owner[j].mktval = fValRemainder;
			}
			nQtyRemainder -= aAssetExt[i].owner[j].quantity;
			fValRemainder -= aAssetExt[i].owner[j].mktval;			
		}
		
		//Process subsets for sale
		for (var k=0; k < aAssetExt[i].forsale.length; k++) {
			//New attr: total market value per sale
			aAssetExt[i].forsale[k].mktval = aAssetExt[i].mktvalPerToken * aAssetExt[i].forsale[k].quantity;
			//last division subset
			if (nQtyRemainder === aAssetExt[i].forsale[k].quantity) {
				aAssetExt[i].forsale[k].mktval = fValRemainder;
			}
			nQtyRemainder -= aAssetExt[i].forsale[k].quantity;
			fValRemainder -= aAssetExt[i].forsale[k].mktval;	
		}
	}
	return aAssetExt;
}

/**
 * Process the list of assets from the server and displays them in the wallet list..
 * This function builds the tables for multiple panels, so an object is needed to
 * identify which table it should be drawing to.
 * @param papers The list of trades to display.
 * @param panelDesc An object describing what panel the assets are being shown in.
 */
function build_assets(assets, panelDesc) {

    var totalAssetValue = 0.00;
    if(assets && assets.length > 0) {
    	
        // If no panel is given, assume this is the wallet panel
        if (!panelDesc) {
            panelDesc = asset_panels[mPanelIdx.wallet];
        }    	

        // Break the assets down into entries
        console.log('breaking assets into individual entries');
        var entries = [];
        for (var asset in assets) {
        	var broken_up = [];
            broken_up = asset_to_entries(assets[asset], user, panelDesc.name);
            entries = entries.concat(broken_up);
        }
        console.log("Displaying", assets.length, "assets as", entries.length, "entries");
      
        entries.sort(panelDesc.sort_selected);
        if (panelDesc.sort_reversed) entries.reverse();

        // Display each entry as a row in the table
        var rows = [];
        for (var i in entries) {
        	
            console.log('!', entries[i]);	
            
			// Add together total amount monetary value of assets (includes ForSale value as well, as it still belongs to the owner)
            totalAssetValue = totalAssetValue + entries[i].valOwned + entries[i].val4Sale; 

            if (excluded(entries[i], panelDesc.filter)) {

                // Create a row for each valid asset
                var data = [];
                if (panelDesc.name === "approve") {
                	data = [
                    	formatDate(Number(entries[i].issueDate), '%d/%M/%Y %I:%m%P'),
	                    escapeHtml(entries[i].name.toUpperCase()),
	                    escapeHtml(entries[i].adrStreet),
	                    escapeHtml(entries[i].adrCity),
	                    entries[i].adrPostcode,
	                    escapeHtml(entries[i].adrState),
	                    entries[i].quantity,
	                    formatMoney(entries[i].mktval),
	                    entries[i].issuer
	            	];
                } else {
                	data = [
                    	formatDate(Number(entries[i].issueDate), '%d/%M/%Y %I:%m%P'),
	                    escapeHtml(entries[i].name.toUpperCase()),
	                    escapeHtml(entries[i].adrStreet),
	                    escapeHtml(entries[i].adrCity),
	                    escapeHtml(entries[i].adrPostcode),
	                    escapeHtml(entries[i].adrState),
	                    entries[i].qtyOwned,
	                    formatMoney(entries[i].valOwned),
	                    entries[i].qty4Sale,
	                    formatMoney(entries[i].val4Sale),
	                    formatMoney(entries[i].mktval),
	                    entries[i].issuer
	            	];	
                }

                var row = createRow(data);
                var style = null;
                style && row.classList.add(style);

                // Only the trade panel should allow you to interact with trades
                var disabled = false;
                var button = detailAssetButton(disabled, entries[i], panelDesc.name);
                button && row.appendChild(button);
                rows.push(row);
            }
        }

        // Placeholder for an empty table
        var html = '';
        if (rows.length == 0) {
        	if (panelDesc.name === "approve") {
            	html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
        	} else {
        		html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
        	}
            $(panelDesc.tableID).html(html);
        } else {
            // Remove the existing table data
            console.log("clearing existing table data");
            var tableBody = $(panelDesc.tableID);
            tableBody.empty();


            // Add the new rows to the table
            console.log("populating new table data");
            var row;
            while (rows.length > 0) {
                row = rows.shift();
                tableBody.append(row);
            }
        }
    } else {
    	if (panelDesc.name === "approve") {
            html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
        } else {
        	html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    	}
        $(panelDesc.tableID).html(html);
    }
	//Display total owned value in the header line
	if (panelDesc.name === "wallet") $("#assetValue").html(formatMoney(totalAssetValue));
}


//EY <-------------
function build_asset_details(oAsset, panelDesc) {
	
	$("input[name='" + panelDesc.name + "-name']").val(oAsset.name);
	$("input[name='" + panelDesc.name + "-adrStreet']").val(oAsset.adrStreet);
	$("input[name='" + panelDesc.name + "-adrCity']").val(oAsset.adrCity);
	$("input[name='" + panelDesc.name + "-adrPostcode']").val(oAsset.adrPostcode);
	$("input[name='" + panelDesc.name + "-adrState']").val(oAsset.adrState);
	$("input[name='" + panelDesc.name + "-issuer']").val(oAsset.issuer);
	$("input[name='" + panelDesc.name + "-issueDate']").val(formatDate(Number(oAsset.issueDate), '%d/%M/%Y %I:%m%P'));
	
	// GO TO WEB/SHOW IMAGE buttons
	var aUrlLinks = oAsset.urlLink || [];
	var btnGo2Web  = $("button[name='" + panelDesc.name + "-btnGo2Web']").get(0);
	var btnShowImg = $("button[name='" + panelDesc.name + "-btnShowImg']").get(0);
	var isGo2Web = false, isShowImg = false;
	if (btnGo2Web) {
		for (var i = 0; i < aUrlLinks.length; i++) {
			if (aUrlLinks[i].urlType === mUrlType.WEB) {
				btnGo2Web.setAttribute('urlLink', aUrlLinks[i].url);
				isGo2Web = true;
			} else if (aUrlLinks[i].urlType === mUrlType.IMG) {
				btnShowImg.setAttribute('cusip', oAsset.cusip);
				isShowImg = true;
			}
		}
		btnGo2Web.disabled  = !isGo2Web;
		btnShowImg.disabled = !isShowImg;
	}

	
	var sStatus = mAssetStatus.PENDING;
	if (oAsset.status) sStatus = oAsset.status;
	$("input[name='" + panelDesc.name + "-status']").val(sStatus);
	
	//Set market value for update and attributes for "Update Market Value" button to be used on click event
	if (panelDesc.name === "walletAsset" || panelDesc.name === "buyAsset") {
		$("input[name='" + panelDesc.name + "-mktValue']").val(formatMoney(oAsset.mktval));
		
	} else if (panelDesc.name === "approveAsset") {

		$("input[name='" + panelDesc.name + "-mktValueUpd']").val(oAsset.mktval);
		var btnMktValue = document.getElementById("submitMktValue");
		if (btnMktValue) {
			btnMktValue.setAttribute('data_cusip', oAsset.cusip); 
			btnMktValue.setAttribute('data_mktval', oAsset.mktval);
		}
	}

	//Build owners/forsale table	
	if(oAsset.owner && oAsset.owner.length > 0) {
		
		// If no panel is given, assume this is the wallet panel
	    if (!panelDesc) {
	     	panelDesc = asset_detail_panels[mPanelIdx.walletAsset];
	    }  
	    
	    // Break the assets down into entries
	    console.log('breaking asset owners into individual entries');
	    var entries = [];
    	if (panelDesc.name === "walletAsset" || panelDesc.name === "approveAsset")
          	entries = asset_owners_to_entries(oAsset, user);
        else if (panelDesc.name === "buyAsset") 
			entries = asset_forsale_to_entries(oAsset, user);            	
	        
	    console.log("Displaying", entries.length, "entries");
		
		// Display each entry as a row in the table
        var rows = [];
        for (var i in entries) {
        	
            console.log('!', entries[i]);

            if (entries[i].quantity > 0) {	//cannot buy when there are none for sale

                var style = null;
                var disabled = false;
                var bRevoke = true;
                
                // Create a row for each valid asset
                var data = [
                    entries[i].invid,				//owner id
                    entries[i].quantity,				//qty
                    formatMoney(entries[i].mktval)	//val to sell/buy
                ];

                var row = createRow(data);
                
                //if user is investor 
            	if (user.name.toLowerCase() !== entries[i].invid.toLowerCase()) {
            		
            		if (panelDesc.name === "walletAsset" || panelDesc.name === "approveAsset") {
	                    //cannot sell not my own stuff
	                    style = 'invalid';
	                    disabled = true; 
                	} else if (panelDesc.name === "buyAsset") {
	                    //Can revoke my own stuff
	                    bRevoke = false; 
                	}

            	}
            	var valInput  = detailAssetSellBuyValInput(disabled, oAsset.cusip, entries[i].invid, panelDesc.name);
            	var valInputName = valInput.firstElementChild.getAttribute('name');
                var qtyInput  = detailAssetSellBuyQtyInput(disabled, oAsset.cusip, entries[i].invid, entries[i].quantity, entries[i].mktval, panelDesc.name, valInputName);
                var qtyInputName = qtyInput.firstElementChild.getAttribute('name');
                var button = detailAssetSellBuyButton(disabled, oAsset.cusip, oAsset.status, entries[i].invid, entries[i].quantity, qtyInputName, panelDesc.name, bRevoke);
  
                row.appendChild(qtyInput);
                row.appendChild(valInput);
                row.appendChild(button);

                style && row.classList.add(style);
                rows.push(row);
            }
        }

        // Placeholder for an empty table
        var html = '';
        if (rows.length == 0) {
            html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td></tr>';
        	$(panelDesc.tableID).html(html);
        } else {
            // Remove the existing table data
            console.log("clearing existing table data");
            var tableBody = $(panelDesc.tableID);
            tableBody.empty();

            // Add the new rows to the table
            console.log("populating new table data");
            var row;
            while (rows.length > 0) {
                row = rows.shift();
                tableBody.append(row);
            }
        }
        
    } else {
        html = '<tr><td>nothing here...</td><td></td><td></td><td></td><td></td><td></td></tr>';
        $(panelDesc.tableID).html(html);
    }
}

function showErrorMessage(sErrorMessage) {
	$("#customErrorNoticeText").html(sErrorMessage);
	$("#customErrorNotificationPanel").fadeIn();	
}

function showDetailPanel(show){
	console.log('show detail', show);
	if(show == '') show = 'wallet';							

	$(".panel").hide();
	if($("#" + show + "Panel").length == 0){
		//$("#error404").fadeIn();
	}
	else{
		$("#" + show + "Panel").fadeIn(300);
		$(".selectedNav").removeClass("selectedNav");
		$(this).addClass("selectedNav");
	}
}
		
//EY ------------------------------------------------------------------------------>


// =================================================================================
//	Helpers for the filtering of trades
// =================================================================================
var filter = {};

/**
 * Describes all the fields that describe a asset.  Used to create
 * a filter that can be used to control which trades get shown in the
 * table.
 * @type {string[]}
 */
var names = [
    "cusip",
    "name",
    "street",
    "city",
    "postcode",
    "state",
    "issuer"
];

/**
 * Parses the filter forms in the UI into an object for filtering
 * which trades are displayed in the table.
 * @param panelDesc An object describing which panel
 */
function processFilterForm(panelDesc) {
    "use strict";

    var form = document.forms[panelDesc.formID];

    console.log("Processing filter form");

    console.log(form.getElementsByTagName("input"));

    // Reset the filter parameters
    panelDesc.filter = {};

    // Build the filter based on the form inputs
    for (var i in names) {

        // Input ID example: "trade_owner"
        var name = names[i];
        var id = panelDesc.filterPrefix + name;

        if (form[id] && form[id].value !== "") {
            panelDesc.filter[name] = form[id].value;
        }
    }

    console.log("New filter parameters: " + JSON.stringify(filter));
    console.log("Rebuilding asset list");
    build_assets(bag.assets, panelDesc);
}

/**
 * Validates an asset object against a given set of filters.
 * @param entry The object to be validated.
 * @param filter The filter object to validate the trade against.
 * @returns {boolean} True if the trade is valid according to the filter, false otherwise.
 */
function excluded(entry, filter) {
    "use strict";

    if (filter.name && filter.name !== "" && entry.name.toUpperCase().indexOf(filter.name.toUpperCase()) == -1) return false;
    if (filter.issuer && filter.issuer !== "" && entry.issuer.toUpperCase().indexOf(filter.issuer.toUpperCase()) == -1) return false;
    if (filter.street && filter.street !== "" && entry.adrStreet.toUpperCase().indexOf(filter.street.toUpperCase()) == -1) return false;
    if (filter.city && filter.city !== "" && entry.adrCity.toUpperCase().indexOf(filter.city.toUpperCase()) == -1) return false;
    if (filter.postcode && filter.postcode !== "" && entry.adrPostcode.toUpperCase().indexOf(filter.postcode.toUpperCase()) == -1) return false;
    if (filter.state && filter.state !== "" && entry.adrState.toUpperCase().indexOf(filter.state.toUpperCase()) == -1) return false;

    // Must be a valid trade if we reach this point
    return true;
}

