var fs = require('fs');
var crypto = require('crypto');
var digestStream = require('digest-stream');
var FormData = require('form-data');
var https = require('https');
var request = require('request');

var debug = false;

var _imagesDataObj = {};
var _folderInfo = {};

var _timeoutValue = 1000 * 10;
var _tooltipDelay = 2000;

var _totalPageItems = 100;

var _useCustomUrl = false;

var allowedFileTypes = {
    "IDSN": {
        "jpg": {
            "open": false,
            "place": true
        },
        "tiff": {
            "open": false,
            "place": true
        },
        "tif": {
            "open": false,
            "place": true
        },
        "gif": {
            "open": false,
            "place": true
        },
        "jpeg": {
            "open": false,
            "place": true
        },
        "bmp": {
            "open": false,
            "place": true
        },
        "eps": {
            "open": false,
            "place": true
        },
        "png": {
            "open": false,
            "place": true
        },
        "ai": {
            "open": false,
            "place": true
        },
        "psd": {
            "open": false,
            "place": true
        },
        "indd": {
            "open": true,
            "place": false
        },
        "indt": {
            "open": true,
            "place": false
        },
        "idml": {
            "open": true,
            "place": false
        },
        "pdf": {
            "open": false,
            "place": true
        },
        "svg": {
            "open": false,
            "place": true
        }
    },
    "ILST": {
        "tiff": {
            "open": false,
            "place": true
        },
        "tif": {
            "open": false,
            "place": true
        },
        "gif": {
            "open": false,
            "place": true
        },
        "jpg": {
            "open": false,
            "place": true
        },
        "jpeg": {
            "open": false,
            "place": true
        },
        "bmp": {
            "open": false,
            "place": true
        },
        "png": {
            "open": false,
            "place": true
        },
        "ai": {
            "open": true,
            "place": true
        },
        "ait": {
            "open": true,
            "place": false
        },
        "eps": {
            "open": true,
            "place": true
        },
        "psd": {
            "open": false,
            "place": true
        },
        "pdf": {
            "open": false,
            "place": true
        },
        "svg": {
            "open": true,
            "place": true
        }
    },
    "PHXS": {
        "jpg": {
            "open": true,
            "place": true
        },
        "tiff": {
            "open": true,
            "place": true
        },
        "tif": {
            "open": true,
            "place": true
        },
        "gif": {
            "open": true,
            "place": true
        },
        "jpeg": {
            "open": true,
            "place": true
        },
        "bmp": {
            "open": true,
            "place": true
        },
        "eps": {
            "open": true,
            "place": true
        },
        "png": {
            "open": true,
            "place": true
        },
        "ai": {
            "open": false,
            "place": true
        },
        "psd": {
            "open": true,
            "place": true
        },
        "pdf": {
            "open": false,
            "place": true
        },
        "svg": {
            "open": true,
            "place": true
        }
    },
    "PHSP": {
        "jpg": {
            "open": true,
            "place": true
        },
        "tiff": {
            "open": true,
            "place": true
        },
        "tif": {
            "open": true,
            "place": true
        },
        "gif": {
            "open": true,
            "place": true
        },
        "jpeg": {
            "open": true,
            "place": true
        },
        "bmp": {
            "open": true,
            "place": true
        },
        "eps": {
            "open": true,
            "place": true
        },
        "png": {
            "open": true,
            "place": true
        },
        "ai": {
            "open": false,
            "place": true
        },
        "psd": {
            "open": true,
            "place": true
        },
        "pdf": {
            "open": false,
            "place": true
        },
        "svg": {
            "open": true,
            "place": true
        }
    }
};


var csInterface = new CSInterface();
var appName = csInterface.hostEnvironment.appName;

var extArray = [];
for(var prop in allowedFileTypes[appName])
    extArray.push(prop);

function convertDate(myDate)
{
    myDate = myDate.replace(/[-:]/g,",").replace("T",",").replace("Z","").split(",");
  
    var currDate = new Date();
    currDate.setTime(Date.UTC(myDate[0],myDate[1]-1,myDate[2],myDate[3],myDate[4],myDate[5]));

    return currDate.toString();
}

function platformUrl(companyName) {
    if (_useCustomUrl) return companyName;

    if (urlMapping[companyName]) return urlMapping[companyName];
    return companyName + ".intelligencebank.com";
}

var IntelligenceApp = React.createClass({
    displayName: "IntelligenceApp",


    updateState: function updateState(updateData) {
        var newState = this.state;

        for (var prop in updateData) {
            newState[prop] = updateData[prop];
        }

        this.setState(newState);
    },

    getInitialState: function getInitialState() {
        var csInterface = new CSInterface();
        var appName = csInterface.hostEnvironment.appName;


        if (appName == "PHSP" || appName == "PHXS") {
            var extId = csInterface.getExtensionID();
            var eventPersistent = new CSEvent("com.adobe.PhotoshopPersistent", "APPLICATION");
            eventPersistent.extensionId = extId;
           if(!debug) csInterface.dispatchEvent(eventPersistent);
        }
        

        
        var initialState = {
            activeScreen: "Home",
            username: "",
            password: "",
            company: "",
            apiUrl: "",
            sessionKey: "",
            apiKey: "",
            token:"",
            userUuid: "",
            folderUuid: "",
            searchTerm: "",
            loginError: "",
            hostName: appName,
            isCustomURL: false,
            hideUnsupported:false,
            placeOriginals:false,
            showPlaceOptions:false,
            showSettingsBar:false,
            customFolder:"~/Documents/IntelligenceBankImages",
            useCustomFolder:false
        };
        
        
        var prefsData = readPrefs();
        if (prefsData) {
            for (var prop in prefsData)
                if (prefsData[prop]!=undefined) initialState[prop] = prefsData[prop];

            initialState.showSettingsBar = false;
            initialState.hideUnsupported = false;
        }
        
        if(!initialState.apiUrl || !initialState.sessionKey || !initialState.apiKey || !initialState.userUuid)
            initialState.activeScreen = "Login"; 
      

        return initialState;
    },

    logoutCallback: function logoutCallback(hours) {
        var value = Number(hours);
        if (!value || isNaN(value)) return;

        setTimeout(this.logout, value * 60 * 60 * 1000);
    },

    logout: function logout() {
        var newState = this.state;

        newState.loginError = "Your session has expired. Please login again.";
        newState.password = "";
        newState.sessionKey = "";
        newState.apiKey = "";
        newState.userUuid = "";

        savePrefs({
            username: this.state.username,
            company: this.state.company,
            apiUrl:this.state.apiUrl,
            apiKey:"",
            sessionKey:"",
            userUuid:"",
            isCustomURL: this.state.isCustomURL,
            placeOriginals:this.state.placeOriginals,
            showPlaceOptions:this.state.showPlaceOptions,
            hideUnsupported:this.state.hideUnsupported,
            customFolder:this.state.customFolder,
            useCustomFolder:this.state.useCustomFolder
        });
        
        newState.activeScreen = "Login";
        newState.showSettingsBar = false;
        this.setState(newState);

    },

    render: function render() {

        switch (this.state.activeScreen) {

            case "Home":
                return React.createElement(HomeScreen, {
                    appState: this.state,
                    updateAppState: this.updateState,
                    logout: this.logout
                });
                break;
            case "BrowserLogin":
             
                return React.createElement(BrowserLoginScreen, {
                    appState: this.state,
                    updateAppState: this.updateState
                });
                break;
            case "Login":
            default:

                return React.createElement(LoginScreen, {
                    appState: this.state,
                    updateAppState: this.updateState,
                    logoutCallback: this.logoutCallback
                });

        }
    }
});

var HomeScreen = React.createClass({
    displayName: "HomeScreen",

    getInitialState: function getInitialState() {
        return {
            folderUuid: "",
            documentOpened: false,
            selectedFolderUuid: "",
            folderName: "",
            documentLinks: [],
            documentName: "",
            documentUuid: "",
            documentSaved: false,
            documentFolderUuid: "",
            documentFolderPermission: {},

            gridData: {
                folder: [],
                resource: []
            },

            searchGridData: [],

            activeSearchPage: 0,
            activeResourcePage: 0,
            activeFolderPage: 0,

            history: [],
            activeTab: "Folder",
            prevActiveTab: "Folder",

            requestsPending: 0,
            downloadsPending: 0,
            downloadsHDPending: 0,
            syncDownloadsPending: 0,

            requestError: "",
            downloadError: false,
            downloadHDError: false,

            defaultFolderSortOrder: "sortorder",
            defaultOrder: "Custom Order"
        };
    },

    componentDidMount: function componentDidMount() {
        
    
        this.updateAllDocument();

        this.increaseRequestsCounter();
        loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, this.state.folderUuid, this.state.activeFolderPage);


    },

    setActivePage: function setActivePage(page) {
        var newState = this.state;
        switch (this.state.activeTab) {
            case "Files":
                this.increaseRequestsCounter();
                newState.activeResourcePage = page;
                loadFilesData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadFilesCallback, this.state.folderUuid, this.state.activeResourcePage);
                break;
            case "Folder":
                this.increaseRequestsCounter();
                newState.activeFolderPage = page;
                loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, this.state.folderUuid, this.state.activeFolderPage);
                break;
            case "Search":
                newState.activeSearchPage = page;
                break;
            default:
                break;    
                /*
        case "SelectDestination":
            this.increaseRequestsCounter();
            newState.activeFolderPage = 0;
            loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, this.state.folderUuid, 0);
            break;  
              */
        }
        this.setState(newState);
    },

    tabCallback: function tabCallback(tab, afterUpload) {
        var newState = this.state;
        
        
        if (newState.activeTab != "Search")
            newState.prevActiveTab = newState.activeTab;

   

        newState.activeTab = tab;
        if (tab == "Document")
            this.updateAllDocument(afterUpload);

        if (tab == "SelectDestination") {
            this.increaseRequestsCounter();
            newState.activeFolderPage = 0;
            loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, this.state.folderUuid, 0);
        }
        
        this.props.updateAppState({showSettingsBar:false});
        this.setState(newState);
    },



    increaseRequestsCounter: function increaseRequestsCounter(value) {
        if (value == undefined) value = 1;
        var newState = this.state;
        if(!newState.requestsPending) newState.requestsPending = 0;
        newState.requestsPending += value;
        this.setState(newState);
    },

    decreaseRequestsCounter: function decreaseRequestsCounter(value) {
     
        if (value == undefined) value = 1;
        var newState = this.state;
        if(!newState.requestsPending) newState.requestsPending = 0;
        newState.requestsPending -= value;
 
        if (newState.requestsPending < 0) newState.requestsPending = 0;
        this.setState(newState);
    },

    increaseDownloadsCounter: function increaseDownloadsCounter(value) {
        if (value == undefined) value = 1;
        var newState = this.state;
        if(!newState.downloadsPending) newState.downloadsPending = 0;
        newState.downloadsPending += value;
        this.setState(newState);
    },

    increaseDownloadsHDCounter: function increaseDownloadsHDCounter(value) {
        if (value == undefined) value = 1;
        var newState = this.state;
        if(!newState.downloadsHDPending) newState.downloadsHDPending = 0;
        newState.downloadsHDPending += value;
        this.setState(newState);
    },
    
    increaseSyncDownloadsCounter: function(value) {
        if (value == undefined) value = 1;
        var newState = this.state;
        if(!newState.syncDownloadsPending) newState.syncDownloadsPending = 0;
        newState.syncDownloadsPending += value;
        this.setState(newState);
    },

    decreaseSyncDownloadsCounter: function (value) {
        if (value == undefined) value = 1;
        
        var newState = this.state;
        if(!newState.syncDownloadsPending) newState.syncDownloadsPending = 0;
        
        newState.syncDownloadsPending -= value;
        if (newState.syncDownloadsPending < 0) newState.syncDownloadsPending = 0;

        

        if (newState.syncDownloadsPending == 0) {
            if (newState.downloadError) {
                Materialize.toast('Sync not completed. Assets missing or you don\'t have permission.', 4000, 'toastFont');
                newState.downloadError = false;
            } else
                Materialize.toast('The document is up to date.', 4000, 'toastFont');

            this.setState(newState);
            this.refreshDocumentInfo();
        } else
            this.setState(newState);
    },
    
    decreaseDownloadsCounter: function decreaseDownloadsCounter(value) {
        if (value == undefined) value = 1;
        var newState = this.state;
        if(!newState.downloadsPending) newState.downloadsPending = 0;
        newState.downloadsPending -= value;
        if (newState.downloadsPending < 0) newState.downloadsPending = 0;


        if (newState.downloadsPending == 0) {
            if (newState.downloadError) {
                Materialize.toast('Some document assets could not be found online.', 4000, 'toastFont');
                newState.downloadError = false;
            } else
                Materialize.toast('The document is up to date.', 4000, 'toastFont');

            this.setState(newState);
            this.refreshDocumentInfo();
        } else
            this.setState(newState);

    },

    decreaseDownloadsHDCounter: function decreaseDownloadsHDCounter(value, processName) {
        if (value == undefined) value = 1;
        if (!processName) processName = "Pre-package";
        var newState = this.state;
        if(!newState.downloadsHDPending) newState.downloadsHDPending = 0;
        
        newState.downloadsHDPending -= value;
        if (newState.downloadsHDPending < 0) newState.downloadsHDPending = 0;

        //  if(debug) alert("decrease hd "+processName+" "+newState.downloadsHDPending);

        if (newState.downloadsHDPending == 0) {
            if (newState.downloadHDError) {
                Materialize.toast(processName + ' not completed. Assets missing or you don\'t have permission.', 4000, 'toastFont');
                newState.downloadHDError = false;
            } else
                Materialize.toast(processName + ' completed.', 4000, 'toastFont');

            this.setState(newState);
            this.refreshDocumentInfo();
        } else
            this.setState(newState);
    },

    //this is called from file download functions to update info in panel
    loadDocumentDataCallback: function loadDocumentDataCallback(data) {

        this.decreaseRequestsCounter();

        var newState = this.state;


        newState.documentName = data.name;
        newState.documentSaved = data.saved;
        newState.documentUuid = data.fileUuid;
        //if(data.fileUuid=="") newState.documentFolderUuid="";


        
        if (data.fileUuid != "")
            this.getParentFolderForFileUUID(data.fileUuid);
        else
            newState.documentFolderUuid = "";

        newState.documentLinks = [];



        for (var fileUuid in data.links) {
            var currData = data.links[fileUuid];
            if (_imagesDataObj[fileUuid] && _imagesDataObj[fileUuid].deleted)
                currData.linkData.deleted = true;
            newState.documentLinks.push(currData.linkData);

        }

        this.setState(newState);
    },

    prePackageDocumentCallback: function prePackageDocumentCallback(data) {
        //download all links as high res

        //update panel view ?
        
        this.decreaseRequestsCounter();
        
        var newState = this.state;

        newState.documentName = data.name;
        newState.documentLinks = [];
        newState.documentSaved = data.saved;

        var totalDownloads = 0;
        for (var fileUuid in data.links) {
            var currData = data.links[fileUuid];
            if (_imagesDataObj[fileUuid] && _imagesDataObj[fileUuid].deleted) {
                currData.linkData.deleted = true;
                newState.downloadHDError = true;
            } else
                totalDownloads++;


                if (!_imagesDataObj[fileUuid])
                {
                    _imagesDataObj[fileUuid] = currData.linkData;
                    _imagesDataObj[fileUuid].permissions = {};
                
                    for(var p=0;p<_imagesDataObj[fileUuid].allowedActions.length;p++)
                        _imagesDataObj[fileUuid].permissions[_imagesDataObj[fileUuid].allowedActions[p]] = true;
                }


            newState.documentLinks.push(currData.linkData);

        }

        this.setState(newState);



        if (!data.saved) {
            myAlert("Please save document first");
            return;
        }
        
        this.increaseDownloadsHDCounter(totalDownloads);
        
        var originalsPath = "";//data.documentLinksPath;
        if(this.props.appState.useCustomFolder)
            originalsPath = this.props.appState.customFolder;

        for (var fileUuid in data.links) {

            if (_imagesDataObj[fileUuid] && _imagesDataObj[fileUuid].deleted)
                continue;

            var currData = data.links[fileUuid];
            
            //check permission!
          //  if (_imagesDataObj[fileUuid].permissions.view)
            placeHDFileToLinks(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, originalsPath, fileUuid, currData.linkData, currData.linkIds, this.hdFileDownloadCallback);
           /* else
            {
                var newState = this.state;
                newState.downloadHDError = true;
                this.setState(newState);
                this.decreaseDownloadsHDCounter();
            }
            */
                //set state to error
        }

        if (totalDownloads == 0) {
            if (this.state.downloadHDError) {
                var newState = this.state;
                newState.downloadHDError = false;
                this.setState(newState);
                Materialize.toast('Pre-package not completed. Assets missing or you don\'t have permission.', 4000, 'toastFont');
            } else
                Materialize.toast('Pre-package completed.', 4000, 'toastFont');
        }



    },

    prePackageDocumentEmbedCallback: function prePackageDocumentEmbedCallback(data) {

         this.decreaseRequestsCounter();
         
        var newState = this.state;



        newState.documentName = data.name;
        newState.documentLinks = [];
        newState.documentSaved = data.saved;

        var totalDownloads = 0;
        for (var fileUuid in data.links) {
            var currData = data.links[fileUuid];
            if (_imagesDataObj[fileUuid] && _imagesDataObj[fileUuid].deleted) {
                currData.linkData.deleted = true;
                newState.downloadHDError = true;
            } else
                totalDownloads++;


                if (!_imagesDataObj[fileUuid])
                {
                    _imagesDataObj[fileUuid] = currData.linkData;
                    _imagesDataObj[fileUuid].permissions = {};
                
                    for(var p=0;p<_imagesDataObj[fileUuid].allowedActions.length;p++)
                        _imagesDataObj[fileUuid].permissions[_imagesDataObj[fileUuid].allowedActions[p]] = true;
                }


            newState.documentLinks.push(currData.linkData);

        }

        this.setState(newState);



        //        if(!data.saved) {myAlert("Please save document first"); return}


        this.increaseDownloadsHDCounter(totalDownloads);
        
        var originalsPath = "";
        if(this.props.appState.useCustomFolder)
            originalsPath = this.props.appState.customFolder;

        for (var fileUuid in data.links) {

            if (_imagesDataObj[fileUuid] && _imagesDataObj[fileUuid].deleted)
                continue;

            var currData = data.links[fileUuid];
            
           // if (_imagesDataObj[fileUuid].permissions.view)
            embedHDFile(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, originalsPath, fileUuid, currData.linkData, currData.linkIds, this.hdFileDownloadEmbedCallback);
            /*
            else
            {
                var newState = this.state;
                newState.downloadHDError = true;
                this.setState(newState);
                this.decreaseDownloadsHDCounter();
            }
            */
        }

        if (totalDownloads == 0) {
            if (this.state.downloadHDError) {
                var newState = this.state;
                newState.downloadHDError = false;
                this.setState(newState);
                Materialize.toast('Embed not completed. Assets missing or you don\'t have permission.', 4000, 'toastFont');
            } else
                Materialize.toast('Embed completed.', 4000, 'toastFont');
        }



    },
    
    
    uploadDocumentCallback: function uploadDocumentCallback(data, updateVersion) {

        this.decreaseRequestsCounter();
        if (!data.saved) {
            myAlert("Please save document first");
            return;
        }

   
        var folderUuid = this.state.selectedFolderUuid;
        var updateResource = false;
        
        
        //check if it's set 
        if (this.state.documentFolderUuid != "") {
            updateResource = true;
            folderUuid = this.state.documentFolderUuid;
        } else
        if (this.state.selectedFolderUuid == "") {
            Materialize.toast('No upload folder selected.', 4000, 'toastFont');
            return;
        }
//!!!
      

        if (updateResource && !this.state.documentFolderPermission.admin && !this.state.documentFolderPermission.publish) {
            Materialize.toast('You do not have permission to update this file.', 4000, 'toastFont');
            return;
        }

        var description = data.name;
        var filename = data.nameWithExt;
        var title = data.name;
        
   
        
        if (_imagesDataObj[data.fileUuid])

        {
            if (_imagesDataObj[data.fileUuid].description)
                description = _imagesDataObj[data.fileUuid].description;

            if (_imagesDataObj[data.fileUuid].name)
                title = _imagesDataObj[data.fileUuid].name;

            filename = title + "." + data.extension;
            
            if (_imagesDataObj[data.fileUuid].file && _imagesDataObj[data.fileUuid].file.name)
                filename = _imagesDataObj[data.fileUuid].file.name;
        }


        this.increaseRequestsCounter();
        
        uploadFile(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, data.fullName, folderUuid, data.fileUuid, filename, title, description, updateResource, updateVersion, this.uploadFinishedCallback);

       
    },

    uploadFinishedCallback: function uploadFinishedCallback(data) {
        
   
        this.decreaseRequestsCounter();
        var jsonData = undefined;


        if (data == "Upload error") {
            Materialize.toast("Upload error.", 4000, 'toastFont');
            this.tabCallback("Document", true);
            return;
        }


        try {

            jsonData = JSON.parse(data);
          
            if(jsonData.error)
            {
                Materialize.toast(jsonData.error, 4000, 'toastFont');
                this.tabCallback("Document", true);
                return;
            }
            
            var newState = this.state;
            newState.documentUuid = jsonData.response._id;
            newState.documentFolderUuid = jsonData.response.folder;
            this.setState(newState);

            //save data to file!
            setIds(newState.documentUuid, newState.documentFolderUuid, this.setIdsCallback);



            //change tab to Document
            Materialize.toast("Upload completed.", 4000, 'toastFont');
        } catch (e) {
            Materialize.toast("Upload error.", 4000, 'toastFont');
            this.tabCallback("Document", true);
        }



    },

    setIdsCallback: function setIdsCallback() {
        this.tabCallback("Document", true);
    },

    updateAllDocumentCallback: function updateAllDocumentCallback(data, updateVersion, afterUpload) {
 
    
       
        this.decreaseRequestsCounter();

        var newState = this.state;
        // myAlert(afterUpload);
        if (data.documents == false) {
            newState.documentName = "";
            newState.documentUuid = "";
            newState.documentSaved = false;
            newState.documentLinks = [];
            newState.documentFolderUuid = "";
            newState.documentOpened = false;
            if (this.state.activeTab == "Document") newState.activeTab = "Folder";
            this.setState(newState);
            return;
        }

        newState.documentOpened = true;
        newState.documentName = data.name;
        newState.documentUuid = data.fileUuid;
        newState.documentSaved = data.saved;
        newState.documentLinks = [];
        if (data.fileUuid == "") newState.documentFolderUuid = "";


        
        //todo check
        if (data.fileUuid != "")
            this.getParentFolderForFileUUID(data.fileUuid);



        for (var fileUuid in data.links) {
            var currData = data.links[fileUuid];
            if (_imagesDataObj[fileUuid] && _imagesDataObj[fileUuid].deleted) {
                currData.linkData.deleted = true;
                newState.downloadError = true;
            }
            if (!_imagesDataObj[fileUuid])
            {
                _imagesDataObj[fileUuid] = currData.linkData;
                _imagesDataObj[fileUuid].permissions = {};
                
                for(var p=0;p<_imagesDataObj[fileUuid].allowedActions.length;p++)
                    _imagesDataObj[fileUuid].permissions[_imagesDataObj[fileUuid].allowedActions[p]] = true;
            }
            newState.documentLinks.push(currData.linkData);

        }

        this.setState(newState);

        var originalsPath = "";
        if(this.props.appState.useCustomFolder)
            originalsPath = this.props.appState.customFolder;
        //run sync

        if (!afterUpload && (data.links != {} || data.fileUuid != "")) {
            this.increaseRequestsCounter();

            syncRequest(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, data.links, data.fileUuid, this.syncRequestCallback, false, originalsPath);
        }
    },

    
    getParentFolderForFileUUID: function getParentFolderForFileUUID(fileUuid) {
  
        parentFolderRequest(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, fileUuid, this.getParentFolderCallback);
    },

    getParentFolderCallback: function getParentFolderCallback(data) {
  
        try {

            //update metadata for file
            
                _imagesDataObj[data.body.response.rows[0]._id] = data.body.response.rows[0];
                
      
                
            //
            var folderUuid = data.body.response.rows[0].folder;
            var newState = this.state;
            newState.documentFolderUuid = folderUuid;
            
            //!!!
            
            _imagesDataObj[data.body.response.rows[0]._id].permissions = {};
            
            for(var p=0;p<_imagesDataObj[data.body.response.rows[0]._id].allowedActions.length;p++)
                _imagesDataObj[data.body.response.rows[0]._id].permissions[_imagesDataObj[data.body.response.rows[0]._id].allowedActions[p]] = true;
            
            newState.documentFolderPermission = _imagesDataObj[data.body.response.rows[0]._id].permissions;
            
         
            this.setState(newState);



        } catch (e) {}
    },

    syncRequestCallback: function syncRequestCallback(data) {
        
        this.decreaseRequestsCounter();
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }
        
        if (data.error) {
            var toastMessage = data.error + ".";

            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            Materialize.toast(toastMessage, 4000, 'toastFont');
            return;
        }

        var res = data.body.response;

        var updateUuid = [];

        var syncInfo = {};

        for (var i = 0; i < res.rows.length; i++) {
            var currData = res.rows[i];
            syncInfo[currData._id] = currData;
        }


        var requiresPanelUpdateFlag = false;
        var newState = this.state;
        var totalDownloads = 0;
        for (var uuid in data.links) {
            if (!syncInfo[uuid] || syncInfo[uuid].status == "deleted") {
                _imagesDataObj[uuid].isEmbedded = false;

                if (data.links[uuid].status != "NORMAL" && data.links[uuid].status != "EMBEDDED")
                    _imagesDataObj[uuid].isPreview = true;

                if (data.links[uuid].status == "EMBEDDED") _imagesDataObj[uuid].isEmbedded = true;
                newState.downloadError = true;

                _imagesDataObj[uuid].deleted = true;
                requiresPanelUpdateFlag = true;
                continue;
            }

            _imagesDataObj[uuid] = syncInfo[uuid];
            
        
                _imagesDataObj[uuid].permissions = {};
                
                for(var p=0;p<_imagesDataObj[uuid].allowedActions.length;p++)
                    _imagesDataObj[uuid].permissions[_imagesDataObj[uuid].allowedActions[p]] = true;
            

            if (data.links[uuid].updatedat != syncInfo[uuid].lastUpdateTime || (data.links[uuid].status != "NORMAL" && data.links[uuid].status != "EMBEDDED"))
                totalDownloads++;
        }

        if(this.state.documentUuid)
        {
        var folderUuid = syncInfo[this.state.documentUuid].folderPath[syncInfo[this.state.documentUuid].folderPath.length-1]._id;

        newState.documentFolderUuid = folderUuid;
        
        
        //permissions - file perms here? folder perms in other cases
        newState.documentFolderPermission = {};
        var perm = syncInfo[this.state.documentUuid]; 
        for(var p=0;p<perm.allowedActions.length;p++)
            newState.documentFolderPermission[perm.allowedActions[p]] = true;
        
        
        }



        this.setState(newState);

if (this.props.appState.placeOriginals)
        this.increaseSyncDownloadsCounter(totalDownloads);
    else
        this.increaseDownloadsCounter(totalDownloads);
    
    var originalsPath = "";//data.documentLinksPath;
    if(this.props.appState.useCustomFolder)
        originalsPath = this.props.appState.customFolder;

   
        for (var uuid in data.links) {


            if (!syncInfo[uuid] || syncInfo[uuid].status == "deleted")
            {
                
                
                if (this.props.appState.placeOriginals)
                    this.decreaseSyncDownloadsCounter(); 
                    else
                this.decreaseDownloadsCounter();
                continue;
            }
            
            if (data.links[uuid].updatedat != syncInfo[uuid].lastUpdateTime || (data.links[uuid].status != "NORMAL" && data.links[uuid].status != "EMBEDDED")) {
                if (this.props.appState.placeOriginals)
                {
                placeHDFileToLinks(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, originalsPath, uuid, data.links[uuid].linkData, data.links[uuid].linkIds, this.hdFileDownloadSyncCallback);
                //this.increaseDownloadsHDCounter();
                }
                else
                {
                placePreviewFileToLinks(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, uuid, data.links[uuid].linkIds, this.previewFileDownloadCallback);
                //this.increaseDownloadsCounter();
                }
            }
        }


        if (requiresPanelUpdateFlag)
            this.refreshDocumentInfo();

        if (totalDownloads == 0) {
            if (this.state.downloadError) {
                var newState = this.state;
                newState.downloadError = false;
                this.setState(newState);
                Materialize.toast('Some document assets could not be found online.', 4000, 'toastFont');
            } else
                Materialize.toast('The document is up to date', 4000, 'toastFont');
        }

    },



    //load folder info callback
    loadCallback: function loadCallback(data) {

        this.decreaseRequestsCounter();
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }
        
        if (data.error) {
             
            var toastMessage = data.error + ".";

            if (data.error.indexOf("Timeout")==0)
                toastMessage = "You are not connected to the internet.";

            Materialize.toast(toastMessage, 4000, 'toastFont');
            return;
        }



        var newState = this.state;
        var response = data.body.response;


        newState.gridData.folder = response.rows;
        
        if(this.state.folderUuid=="")
        _folderInfo["root"]={
            folders:response.count
        };
        
        for(var i=0;i<response.rows.length;i++)
        {
            var currRow = response.rows[i];
            _folderInfo[currRow._id]={
                folders:currRow.folders_count,
                resources:currRow.resources_count
            };
        }
        this.setState(newState);


    },

    //load files info callback
    loadFilesCallback: function loadFilesCallback(data) {

        this.decreaseRequestsCounter();
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }
        
        if (data.error) {
          
            var toastMessage = data.error + ".";

            if (data.error.indexOf("Timeout")==0)
                toastMessage = "You are not connected to the internet.";

            Materialize.toast(toastMessage, 4000, 'toastFont');
            return;
        }



        var newState = this.state;
        var response = data.body.response;


        newState.gridData.resource = response.rows;


        for (var i = 0; i < response.rows.length; i++) {
            _imagesDataObj[response.rows[i]._id] = response.rows[i];
            
         
                _imagesDataObj[response.rows[i]._id].permissions = {};
                
                for(var p=0;p<_imagesDataObj[response.rows[i]._id].allowedActions.length;p++)
                    _imagesDataObj[response.rows[i]._id].permissions[_imagesDataObj[response.rows[i]._id].allowedActions[p]] = true;
            
            
        }


        this.setState(newState);


    },


    searchCallback: function searchCallback(data) {

        this.decreaseRequestsCounter();
      
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }
        
        if (data.error) {
            var toastMessage = data.error + ".";

            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            Materialize.toast(toastMessage, 4000, 'toastFont');
            return;
        }


        var newState = this.state;
        var response = data.body.response;
        newState.searchGridData = response.rows;
        newState.activeSearchPage = 0;
        //newState.activeTab = "Search";


    
            for (var i = 0; i < response.rows.length; i++) {
                _imagesDataObj[response.rows[i]._id] = response.rows[i];
                
                _imagesDataObj[response.rows[i]._id].permissions = {};
                
                for(var p=0;p<_imagesDataObj[response.rows[i]._id].allowedActions.length;p++)
                    _imagesDataObj[response.rows[i]._id].permissions[_imagesDataObj[response.rows[i]._id].allowedActions[p]] = true;
            
            
            }
      

        this.setState(newState);
    },

    //called when file is placed from panel to layout
    placePreviewCallback: function placePreviewCallback(data) {



        this.decreaseRequestsCounter();
        
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }

        if (data.error) {
            var toastMessage = data.error + ".";

            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            Materialize.toast(toastMessage, 4000, 'toastFont');
            return;
        }

        //update link info and refresh info
        var newState = this.state;
        _imagesDataObj[data.uuid].isPreview = true;

        //check if the file is already placed
        var newLinkInfo = [];
        newLinkInfo.push(_imagesDataObj[data.uuid]);

        for (var u = 0; u < newState.documentLinks.length; u++)
            if (newState.documentLinks[u].fileUuid != data.uuid)
                newLinkInfo.push(newState.documentLinks[u]);



        newState.documentLinks = newLinkInfo;
        this.setState(newState);

        //place file
        placeImageToLayout(data.filePath, data.uuid, _imagesDataObj[data.uuid], this.refreshDocumentInfo,this.props.appState.showPlaceOptions);

    },
    
    //called when file is placed from panel to layout
    placeHDCallback: function placeHDCallback(data) {



        this.decreaseRequestsCounter();
        
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }


        if (data.error) {
            var toastMessage = data.error + ".";

            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            var errStyle = 'toastFont';
            if (data.error == "Missing local permission to create the destination Folder")
                errStyle = 'toastError';
            
            Materialize.toast(toastMessage, 4000, errStyle);
            return;
        }

        //update link info and refresh info
        var newState = this.state;
        _imagesDataObj[data.uuid].isPreview = false;

        //check if the file is already placed
        var newLinkInfo = [];
        newLinkInfo.push(_imagesDataObj[data.uuid]);

        for (var u = 0; u < newState.documentLinks.length; u++)
            if (newState.documentLinks[u].fileUuid != data.uuid)
                newLinkInfo.push(newState.documentLinks[u]);



        newState.documentLinks = newLinkInfo;
        this.setState(newState);

        //place file
        placeImageToLayout(data.filePath, data.uuid, _imagesDataObj[data.uuid], this.refreshDocumentInfo,this.props.appState.showPlaceOptions);

    },

    openFileCallback: function openFileCallback(data) {


        this.decreaseRequestsCounter();
        
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }


        if (data.error) {
            var toastMessage = data.error + ".";

            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            
            var errStyle = 'toastFont';
            if (data.error == "Missing local permission to create the destination Folder")
                errStyle = 'toastError';
            
            Materialize.toast(toastMessage, 4000, errStyle);
            return;
        }

        //update link info and refresh info
        var newState = this.state;
        _imagesDataObj[data.uuid].isPreview = false;

        //check if the file is already placed
        /*
         var newLinkInfo = [];
         newLinkInfo.push(_imagesDataObj[data.uuid]);
         
         for(var u=0;u<newState.documentLinks.length;u++)
             if(newState.documentLinks[u].fileUuid!=data.uuid)
                 newLinkInfo.push(newState.documentLinks[u]);
             
         
         
         newState.documentLinks = newLinkInfo;
		 
         this.setState(newState);
         */
        //place file
        _imagesDataObj[data.uuid].folderUuid = this.state.folderUuid;
        openImageAsLayout(data.filePath, data.uuid, _imagesDataObj[data.uuid], this.refreshDocumentInfo);

    },

    hdFileDownloadCallback: function hdFileDownloadCallback(data) {



        this.decreaseDownloadsHDCounter();
        
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }

        if (data.error) {
            var toastMessage = data.error + ".";
            var newState = this.state;
            newState.downloadHDError = true;
            this.setState(newState);
            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            var errStyle = 'toastFont';
            if (data.error == "Missing local permission to create the destination Folder")
                errStyle = 'toastError';
            
            Materialize.toast(toastMessage, 4000, errStyle);
            return;
        }

        //update link info and refresh info
        var newState = this.state;
        _imagesDataObj[data.uuid].isPreview = false;
        //  _imagesDataObj[data.uuid].isEmbedded = false;

        //check if the file is already placed
        var newLinkInfo = [];
        newLinkInfo.push(_imagesDataObj[data.uuid]);

        for (var u = 0; u < newState.documentLinks.length; u++)
            if (newState.documentLinks[u].fileUuid != data.uuid)
                newLinkInfo.push(newState.documentLinks[u]);



        newState.documentLinks = newLinkInfo;
        this.setState(newState);

        //place file

        updateLinks(data.filePath, _imagesDataObj[data.uuid], data.linkIds, this.refreshDocumentInfo);


    },
    
    hdFileDownloadSyncCallback: function (data) {



        this.decreaseSyncDownloadsCounter();
        
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }

        if (data.error) {
            var toastMessage = data.error + ".";
            var newState = this.state;
            newState.downloadHDError = true;
            this.setState(newState);
            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            var errStyle = 'toastFont';
            if (data.error == "Missing local permission to create the destination Folder")
                errStyle = 'toastError';
            
            Materialize.toast(toastMessage, 4000, errStyle);
            return;
        }

        //update link info and refresh info
        var newState = this.state;
        _imagesDataObj[data.uuid].isPreview = false;
        //  _imagesDataObj[data.uuid].isEmbedded = false;

        //check if the file is already placed
        var newLinkInfo = [];
        newLinkInfo.push(_imagesDataObj[data.uuid]);

        for (var u = 0; u < newState.documentLinks.length; u++)
            if (newState.documentLinks[u].fileUuid != data.uuid)
                newLinkInfo.push(newState.documentLinks[u]);



        newState.documentLinks = newLinkInfo;
        this.setState(newState);

        //place file

        updateLinks(data.filePath, _imagesDataObj[data.uuid], data.linkIds, this.refreshDocumentInfo);


    },

    hdFileDownloadEmbedCallback: function hdFileDownloadEmbedCallback(data) {


        this.decreaseDownloadsHDCounter(1, "Embed");
        
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }

        if (data.error) {
            
            var toastMessage = data.error + ".";
            var newState = this.state;
            newState.downloadHDError = true;
            this.setState(newState);
            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            var errStyle = 'toastFont';
            if (data.error == "Missing local permission to create the destination Folder")
                errStyle = 'toastError';
            
            Materialize.toast(toastMessage, 4000, errStyle);
            return;
        }

        //update link info and refresh info
        var newState = this.state;
        _imagesDataObj[data.uuid].isPreview = false;
        // _imagesDataObj[data.uuid].isEmbedded = true;

        //check if the file is already placed
        var newLinkInfo = [];
        newLinkInfo.push(_imagesDataObj[data.uuid]);

        for (var u = 0; u < newState.documentLinks.length; u++)
            if (newState.documentLinks[u].fileUuid != data.uuid)
                newLinkInfo.push(newState.documentLinks[u]);



        newState.documentLinks = newLinkInfo;
        this.setState(newState);

        //place file
        updateLinksEmbed(data.filePath, _imagesDataObj[data.uuid], data.linkIds, this.refreshDocumentInfo);


    },

    previewFileDownloadCallback: function previewFileDownloadCallback(data) {


        this.decreaseDownloadsCounter();
        
        //check if logged out - for shared login, then direct to login screen
        if (data.error && (data.error == "Invalid request" || data.error == "Invalid response" || data.error == "No valid session. Authentication is required" || data.error=="error.authentication.required"))
        {
            savePrefs({
                username: this.props.appState.username,
                company: this.props.appState.company,
                apiUrl:this.props.appState.apiUrl,
                apiKey:"",
                sessionKey:"",
                userUuid:"",
                isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
            });
            
            this.props.updateAppState({activeScreen:"Login",apiKey:""});
            return;
        }

        if (data.error) {
            var toastMessage = data.error + ".";
            var newState = this.state;
            newState.downloadError = true;
            this.setState(newState);
            if (data.error == "Timeout.")
                toastMessage = "You are not connected to the internet.";

            Materialize.toast(toastMessage, 4000, 'toastFont');
            return;
        }

        //update link info and refresh info
        var newState = this.state;
        _imagesDataObj[data.uuid].isPreview = true;

        //check if the file is already placed
        var newLinkInfo = [];
        newLinkInfo.push(_imagesDataObj[data.uuid]);

        for (var u = 0; u < newState.documentLinks.length; u++)
            if (newState.documentLinks[u].fileUuid != data.uuid)
                newLinkInfo.push(newState.documentLinks[u]);



        newState.documentLinks = newLinkInfo;
        this.setState(newState);

        //place file
        updateLinks(data.filePath, _imagesDataObj[data.uuid], data.linkIds, this.refreshDocumentInfo);

    },


    refreshDocumentInfo: function refreshDocumentInfo() {
        //if((this.state.requestsPending+this.state.downloadsPending+this.state.downloadsHDPending)>0) return;
        //Materialize.toast('refresh', 4000, 'toastFont'); 
        this.increaseRequestsCounter();
        loadDocumentData(this.loadDocumentDataCallback);
    },



    prePackageDocument: function prePackageDocument() {
        if ((this.state.requestsPending + this.state.downloadsPending + this.state.downloadsHDPending) > 0) return;
        
        this.increaseRequestsCounter();
        loadDocumentData(this.prePackageDocumentCallback);
    },

    prePackageDocumentEmbed: function prePackageDocumentEmbed() {
        if ((this.state.requestsPending + this.state.downloadsPending + this.state.downloadsHDPending) > 0) return;
        
        this.increaseRequestsCounter();
        loadDocumentData(this.prePackageDocumentEmbedCallback);
    },

    updateAllDocument: function updateAllDocument(afterUpload) {
        // if((this.state.requestsPending+this.state.downloadsPending+this.state.downloadsHDPending)>0) return;
       
        
        this.increaseRequestsCounter();
        loadDocumentData(this.updateAllDocumentCallback, undefined, afterUpload);

    },

    uploadDocument: function uploadDocument(updateVersion) {
        //        if((this.state.requestsPending+this.state.downloadsPending+this.state.downloadsHDPending)>0) return;
        this.increaseRequestsCounter();
        loadDocumentData(this.uploadDocumentCallback, updateVersion);
    },

    search: function search(searchTerm) {
        if (searchTerm == "") return;
        this.increaseRequestsCounter();
        loadSearchData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.searchCallback, searchTerm, this.state.folderUuid);
    },

    openFolder: function openFolder(folderUuid, folderName, foldersLength, resourcesLength, defaultOrder) {
 
        if(!foldersLength && !resourcesLength) return;

        var newState = this.state;
        var newHistory = newState.history;

        newState.gridData.folder = [];
        newState.gridData.resource = [];



        newHistory.push({
            folderUuid: this.state.folderUuid,
            folderName: this.state.folderName,
            activeResourcePage: this.state.activeResourcePage,
            activeFolderPage: this.state.activeFolderPage,
            activeTab:this.state.activeTab
        });
        newState.history = newHistory;
        newState.folderUuid = folderUuid;
        newState.folderName = folderName;
      //  newState.defaultOrder = defaultOrder;

        newState.activeResourcePage = 0;
        newState.activeFolderPage = 0;
        if(resourcesLength)
            newState.activeTab = "Files";
        else
           newState.activeTab = "Folder"; 
        this.setState(newState);
       
        if(foldersLength)
        {
        this.increaseRequestsCounter();
        loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, folderUuid, this.state.activeFolderPage);
        }
        
        if(resourcesLength)
        {
        this.increaseRequestsCounter();
        loadFilesData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadFilesCallback, folderUuid, this.state.activeResourcePage);
        }
       

    },

    openSelectFolder: function openSelectFolder(folderUuid, folderName, defaultOrder) {
        var newState = this.state;
        var newHistory = newState.history;

        newState.gridData.folder = [];
        newState.gridData.resource = [];

        newHistory.push({
            folderUuid: this.state.folderUuid,
            folderName: this.state.folderName
        });

        newState.history = newHistory;
        newState.folderUuid = folderUuid;
        newState.folderName = folderName;
        newState.defaultOrder = defaultOrder;

        newState.activeResourcePage = 0;
        newState.activeFolderPage = 0;
        newState.activeTab = "SelectDestination";

        this.setState(newState);

        this.increaseRequestsCounter();
        loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, folderUuid, 0, defaultOrder);
    },


    selectFolder: function selectFolder(folderUuid) {

        var newState = this.state;
        newState.selectedFolderUuid = folderUuid;
        this.setState(newState);
    },

    placeFile: function placeFile(fileUuid) {
        
        placeFileCheck(fileUuid, this.placeFileChecked);
    },

    openFile: function openFile(fileUuid) {
        openFileCheck(fileUuid, this.openFileChecked);
    },

    placeFileChecked: function placeFileChecked(response) {
        if (response == "false") {
            var toastMessage = "You do not have any open document to place the asset into.";
            Materialize.toast(toastMessage, 4000, 'toastFont');
            return;
        }
   
        var fileUuid = response;
        this.increaseRequestsCounter();
        
        var originalsPath = "";
        if(this.props.appState.useCustomFolder)
            originalsPath = this.props.appState.customFolder;
      
        if (this.props.appState.placeOriginals/* && _imagesDataObj[fileUuid].permissions.view*/)
        placeHDFile(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, fileUuid, this.placeHDCallback, originalsPath);
        else
        {
        placePreviewFile(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, fileUuid, this.placePreviewCallback);
        }
    },

    openFileChecked: function openFileChecked(response) {
        if (response == "false") {
            
            var toastMessage = "This asset is already opened. Close it first and try again.";
            Materialize.toast(toastMessage, 4000, 'toastError');
            return;
        }

        var originalsPath = "";
        if(this.props.appState.useCustomFolder)
            originalsPath = this.props.appState.customFolder;
        
        var fileUuid = response;
        this.increaseRequestsCounter();
        openHDFile(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, fileUuid, this.openFileCallback, originalsPath);
    },

    selectDestination: function selectDestination() {
        var newState = this.state;

        newState.folderUuid = "";
        newState.documentFolderUuid = ""; //TODO - to disable update if it's called from 'Upload as New' 
        newState.folderName = "";
        newState.activeResourcePage = 0;
        newState.activeFolderPage = 0;
        this.setState(newState);

        this.increaseRequestsCounter();
        loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, newState.folderUuid, 0);

        this.tabCallback("SelectDestination");
    },

    back: function back(home) {
        
        try{
        var newState = this.state;
        

        var newHistory = newState.history;
        
        if (newState.activeTab != "SelectDestination")
            newState.activeTab = "Folder";
        
      

        if (home) {
            newHistory = [];
            newState.folderUuid = "";
            newState.folderName = "";
            newState.activeResourcePage = 0;
            newState.activeFolderPage = 0;
        } else
        if (newHistory.length) {
            var historyObj = newHistory.pop();
            newState.folderUuid = historyObj.folderUuid;
            newState.folderName = historyObj.folderName;
            newState.activeFolderPage = historyObj.activeFolderPage;
            newState.activeResourcePage = historyObj.activeResourcePage;
            if (newHistory.length && newState.activeTab != "SelectDestination")
                newState.activeTab = historyObj.activeTab;
        }

        newState.history = newHistory;

        newState.gridData.folder = [];
        newState.gridData.resource = [];

        this.setState(newState);
        
        this.increaseRequestsCounter();
        
        if(!historyObj || historyObj.activeTab=="Folder")
        loadFolderData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadCallback, newState.folderUuid, this.state.activeFolderPage);
        else
        if(historyObj.activeTab=="Files")
            loadFilesData(this.props.appState.apiKey, this.props.appState.userUuid, this.props.appState.sessionKey, this.props.appState.apiUrl, this.loadFilesCallback, newState.folderUuid, this.state.activeFolderPage);
    }catch(e){
    //    alert(e+":"+e.line)
    }

    },
    
    toggleSettingsBar:function toggleSettingsBar()
    {
        this.props.updateAppState({showSettingsBar:!this.props.appState.showSettingsBar});
    },

    render: function render() {

        var selectFolderCells = [];

        if (this.state.activeTab == "SelectDestination") {
            var foldersData = this.state.gridData.folder;
            var startIndex = 0;
            var endIndex = foldersData.length;
            
            
            
            for (var i = startIndex; i < endIndex; i++) {
                var currFolder = foldersData[i];
                
                var perms = {};
                for(var j=0;j<currFolder.allowedActions.length;j++)
                    perms[currFolder.allowedActions[j]]=true;
                
                selectFolderCells.push(React.createElement(SelectFolderCard, {
                    // image: "https://"+this.props.appState.apiUrl+"/webapp/1.0/icon?p60=0db17b942ed391096168f41f90051acc&p10=" + this.props.appState.apiKey + "&p20=" + this.props.appState.userUuid + "&type=folder&name=" + currFolder.folderuuid,
                    image: currFolder.thumbnail,
                    uuid: currFolder._id,
                    name: currFolder.name,
                    folders: currFolder.folders_count,
                    images: currFolder.resources_count,
                    key: currFolder._id,
                    perm: perms,
                    openFolder: this.openSelectFolder,
                    selectFolder: this.selectFolder,
                    selectedFolderUuid: this.state.selectedFolderUuid
                }));
            }
        }

        var folderCells = [];

        if (this.state.activeTab == "Folder") {
            var foldersData = this.state.gridData.folder;

            var startIndex = 0;
            var endIndex = foldersData.length;
            
            

            if (foldersData.length > _totalPageItems) {
                startIndex = this.state.activeFolderPage * _totalPageItems;
                endIndex = Math.min(endIndex, startIndex + _totalPageItems);
            }

            for (var i = startIndex; i < endIndex; i++) {
                var currFolder = foldersData[i];
                
                var perms = {};
                for(var j=0;j<currFolder.allowedActions.length;j++)
                    perms[currFolder.allowedActions[j]]=true;
                
                folderCells.push(React.createElement(FolderCard, {
                    //image: "https://"+this.props.appState.apiUrl+"/webapp/1.0/icon?p60=0db17b942ed391096168f41f90051acc&p10=" + this.props.appState.apiKey + "&p20=" + this.props.appState.userUuid + "&type=folder&name=" + currFolder.folderuuid,
                    image: currFolder.thumbnail,
                    uuid: currFolder._id,
                    name: currFolder.name,
                    folders: currFolder.folders_count,
                    images: currFolder.resources_count,
                    key: currFolder._id,
                    perm: perms,
                    onClick: this.openFolder
                }));
            }
        }

        var imageCells = [];

        if (this.state.activeTab == "Files" || this.state.activeTab == "Search") {
            
            try{
            var imagesData = this.state.gridData.resource;
            var activePage = this.state.activeResourcePage;

            if (this.state.activeTab == "Search") {
           
                imagesData = this.state.searchGridData;
                activePage = this.state.activeSearchPage;
            }

            var startIndex = 0;
            var endIndex = imagesData.length;

            if (imagesData.length > _totalPageItems) {
                startIndex = activePage * _totalPageItems;
                endIndex = Math.min(endIndex, startIndex + _totalPageItems);
            }

            for (var i = startIndex; i < endIndex; i++) {
                var currImage = imagesData[i];
                var disabled = true;
                var usePlace = false;
                var useOpen = false;
                
                if(!currImage.file) continue;
                if (allowedFileTypes[this.props.appState.hostName][fileExtension(currImage.file.name)]) {
                    disabled = false;
                    useOpen = allowedFileTypes[this.props.appState.hostName][fileExtension(currImage.file.name)].open;
                    usePlace = allowedFileTypes[this.props.appState.hostName][fileExtension(currImage.file.name)].place;
                }
                
                if(this.props.appState.hideUnsupported && disabled) continue;
               
               /*
When Resource is "checkout": true, a lock icon appears in alert red color on the Resource listed in the Folder. On hover, a tooltip comes up: "Resource checked out by {{checkoutUserName}} on {{checkoutTime}}.

{{checkoutUserName}} and {{checkoutTime}} will be added to the response next week. Details to test on our staging environment are in the comments below.

This is the data to expect in the response:

"checkout": true
"checkoutUserName": "IntelligenceBank Product",
"checkoutTime": "2021-11-18T17:54:32Z",

Question: can the time display be automatically adjusted to the timezone of the user based on their system settings?

Example of a "checkout":true resource on evgeny.intelligencebank.com is in the Stock Photography folder (young fitness woman..., 519ef9f648413c673be6486bb99a94b1)
                */

                imageCells.push(React.createElement(ImageCard, {
                    image: currImage.thumbnail,
                    uuid: currImage._id,
                    name: currImage.name,
                    description: currImage.fancyFileSize + ", " + currImage.fancyFileType,
                    key: currImage._id,
                    disabled: disabled,
                    placeFile: this.placeFile,
                    openFile: this.openFile,
                    useOpen: useOpen,// && _imagesDataObj[currImage._id].permissions.view,
                    usePlace: usePlace,
                    checkout: currImage.checkout,
                    checkoutUserName:currImage.checkoutUserName,
                    checkoutTime:currImage.checkoutTime
                }));
            }
            
        }catch(e){}
        }

        var linkCells = [];

        if (this.state.activeTab == "Document") {
            var imagesData = this.state.documentLinks;

            for (var i = 0; i < imagesData.length; i++) {
                var currImage = imagesData[i];
                linkCells.push(React.createElement(LinkCard, {
                    // image: "https://"+this.props.appState.apiUrl+"/webapp/1.0/icon?p60=0db17b942ed391096168f41f90051acc&p10=" + this.props.appState.apiKey + "&p20=" + this.props.appState.userUuid + "&type=file&name=" + currImage.fileuuid+"&ver="+currImage.versions.length,
                    image: currImage.thumbnail,
                    uuid: currImage._id,
                    name: currImage.name,
                    description: currImage.fancyFileSize + ", " + currImage.fancyFileType,
                    isPreview: currImage.isPreview,
                    isEmbedded: currImage.isEmbedded,
                    key: currImage.isPreview + "_" + currImage.isEmbedded + "_" + currImage._id,
                    deleted: currImage.deleted
                }));
            }
        }


        var showPaginator = false;
        var totalItems = 0;
        switch (this.state.activeTab) {
            case "Folder":
                if(this.state.folderUuid=="" && _folderInfo["root"])
                    totalItems = _folderInfo["root"].folders;
                    else
                if (_folderInfo[this.state.folderUuid]) totalItems = _folderInfo[this.state.folderUuid].folders;
               
                break;
            case "Files":
               
                if (_folderInfo[this.state.folderUuid]) totalItems = _folderInfo[this.state.folderUuid].resources;
                break;
            case "Search":
                var totalItems = this.state.searchGridData.length;
                break;
            default:
                break;
        };
        showPaginator = totalItems > _totalPageItems;
 
        return React.createElement(
            "div",
            null,
            (this.state.requestsPending + this.state.downloadsPending + this.state.downloadsHDPending) > 0 ? React.createElement(ProgressBar, {
                homeState: this.state,
                appState: this.props.appState
            }) : null,

            React.createElement(HomeHeader, {
                back: this.back,
                homeState: this.state,
                tabCallback: this.tabCallback,
                toggleSettingsBar: this.toggleSettingsBar,
                search: this.search,
                appState: this.props.appState,
                updateAppState: this.props.updateAppState
            }),
            
            this.state.activeTab == "Options" ? null : React.createElement(NavBar, {
                homeState: this.state,
                tabCallback: this.tabCallback
            }),

            this.state.activeTab == "Document" && this.state.documentOpened ? React.createElement(DocumentBar, {
                homeState: this.state,
                appState: this.props.appState,
                prePackageDocument: this.prePackageDocument,
                prePackageDocumentEmbed: this.prePackageDocumentEmbed,
                updateAllDocument: this.updateAllDocument
            }) : null,
            
            this.props.appState.showSettingsBar ? React.createElement(SettingsBar, {
                appState: this.props.appState,
                tabCallback: this.tabCallback,
                logout: this.props.logout,
                activeTab: this.state.activeTab
            }) : null,
            
            this.state.activeTab == "Options" ? React.createElement(SettingsScreen, {
                appState: this.props.appState,
                updateAppState: this.props.updateAppState
            }) : null,
            
            this.state.activeTab == "Options" ? null : React.createElement(Grid, {
                homeState: this.state,
                selectFolderCells: selectFolderCells,
                folderCells: folderCells,
                imageCells: imageCells,
                linkCells: linkCells
            }),

            this.state.activeTab == "Folder" && showPaginator ? React.createElement(Paginator, {
                homeState: this.state,
                totalItems: totalItems,
                activePage: this.state.activeFolderPage,
                setActivePage: this.setActivePage,
                type: "folders"
            }) : null,

            this.state.activeTab == "Files" && showPaginator ? React.createElement(Paginator, {
                homeState: this.state,
               totalItems: totalItems,
                activePage: this.state.activeResourcePage,
                setActivePage: this.setActivePage,
                type: "resources"
            }) : null,

            this.state.activeTab == "Search" && showPaginator ? React.createElement(Paginator, {
                homeState: this.state,
                totalItems: totalItems,
                activePage: this.state.activeSearchPage,
                setActivePage: this.setActivePage
            }) : null,

            this.state.activeTab == "Document" && this.state.documentOpened ? React.createElement(DocumentUploadBar, {
                selectDestination: this.selectDestination,
                uploadDocument: this.uploadDocument,
                documentUuid: this.state.documentUuid,
                documentSaved: this.state.documentSaved,
                permission: this.state.documentFolderPermission
            }) : null,

            this.state.activeTab == "SelectDestination" && this.state.documentOpened ? React.createElement(DocumentUploadSelectBar, {
                uploadDocument: this.uploadDocument,
                tabCallback: this.tabCallback,
                selectedFolderUuid: this.state.selectedFolderUuid
            }) : null
        );
    }
});

var CircularPreLoader = React.createClass({
    displayName: "CircularPreLoader",
    render: function render() {
        return React.createElement(
            "div", {
                "className": "circularBlock"
            },
            React.createElement(
                "div", {
                    "className": "circular"
                },
                React.createElement(
                    "div", {
                        "className": "preloader-wrapper active"
                    },
                    React.createElement(
                        "div", {
                            "className": "spinner-layer spinner-green-only"
                        },
                        React.createElement(
                            "div", {
                                "className": "circle-clipper left"
                            },
                            React.createElement("div", {
                                "className": "circle"
                            })
                        ),
                        React.createElement(
                            "div", {
                                "className": "gap-patch"
                            },
                            React.createElement("div", {
                                "className": "circle"
                            })
                        ),
                        React.createElement(
                            "div", {
                                "className": "circle-clipper right"
                            },
                            React.createElement("div", {
                                "className": "circle"
                            })
                        )
                    )
                )
            )
        );
    }

});

var ProgressBar = React.createClass({
    displayName: "ProgressBar",

    render: function render() {
        return React.createElement(
            "div", {
                "className": "progressBar"
            },
            React.createElement(
                "div", {
                    "className": "progress"
                },
                React.createElement("div", {
                    "className": "indeterminate"
                })
            )
        )
    }
});

var DocumentUploadBar = React.createClass({
    displayName: "DocumentUploadBar",

    render: function render() {
        var _this = this;
        var footerText = "";
        if (this.props.documentUuid == "")
            footerText = "You can save this document to your platform";
        else
        if (!this.props.documentSaved) footerText = "Your document has been updated";

        return React.createElement(
            "div", {
                className: "footer_upload document"
            },
            React.createElement(
                "p", {
                    className: "footer_text"
                }, //Your document has been updated
                footerText
            ),
            React.createElement(
                "div", {
                    className: "footer_buttons"
                },
                this.props.documentUuid != "" && (this.props.permission.admin || this.props.permission.publish) ?
                React.createElement(
                    "div", {
                        className: "button waves-effect waves-light btn_pre hand_cursor tooltipped",
                        "data-position": "top",
                        "data-tooltip": "Click to save changes made to this file",
                        onClick: function onClick(event) {
                            return _this.props.uploadDocument(false);
                        }
                    },
                    React.createElement(
                        "i", {
                            className: "material-icons left"
                        },
                        "cloud_upload"
                    ),
                    "Save Changes"
                ) : null,
                this.props.documentUuid != "" && (this.props.permission.admin || this.props.permission.publish) ? React.createElement(
                    "div", {
                        className: "button waves-effect waves-light btn_pre hand_cursor tooltipped",
                        "data-position": "top",
                        "data-tooltip": "Click to save changes made to this file as a new version",
                        onClick: function onClick(event) {
                            return _this.props.uploadDocument(true);
                        }
                    },
                    React.createElement(
                        "i", {
                            className: "material-icons left"
                        },
                        "exposure_plus_1"
                    ),
                    "New Version"
                ) : null,
                React.createElement(
                    "div", {
                        className: "button waves-effect waves-light btn_pre hand_cursor tooltipped",
                        "data-position": "top",
                        "data-tooltip": "Select upload destination folder",
                        onClick: function onClick(event) {
                            return _this.props.selectDestination();
                        }
                    },
                    React.createElement(
                        "i", {
                            className: "material-icons left"
                        },
                        "folder"
                    ),
                    this.props.documentUuid == "" || (this.props.permission.admin && this.props.permission.publish) ? "Select Destination" : "Upload as New"
                )
            )
        );
    }
});


var DocumentUploadSelectBar = React.createClass({
    displayName: "DocumentUploadSelectBar",

    render: function render() {
        var _this = this;
        return React.createElement(
            "div", {
                className: "footer_upload"
            },
            React.createElement(
                "div", {
                    className: this.props.selectedFolderUuid != "" ? "button waves-effect waves-light btn_pre hand_cursor tooltipped" : "button disabled btn_pre tooltipped",
                    "data-position": "top",
                    "data-tooltip": "upload",
                    disabled: this.props.selectedFolderUuid == "",
                    onClick: function onClick(event) {
                        if (_this.props.selectedFolderUuid != "")
                            return _this.props.uploadDocument(false);
                    }
                },
                React.createElement(
                    "i", {
                        className: "material-icons left"
                    },
                    "cloud_upload"
                ),
                "Upload Document"
            ),
            React.createElement(
                "div", {
                    className: "button waves-effect waves-light btn_pre hand_cursor tooltipped",
                    "data-position": "top",
                    "data-tooltip": "upload",
                    onClick: function onClick(event) {
                        return _this.props.tabCallback("Document");
                    }
                },
                React.createElement(
                    "i", {
                        className: "material-icons left"
                    },
                    "block"
                ),
                "Cancel Upload"
            )
        );
    }
});

var Footer = React.createClass({
    displayName: "Footer",

    render: function render() {
        return React.createElement(
            "div", {
                className: "footer"
            },
            this.props.homeState.activeTab == "Document" ? React.createElement(
                "p",
                null,
                this.props.homeState.documentLinks.length == 1 ? "This document has " + this.props.homeState.documentLinks.length + " IntelligenceBank link." : "The current document has " + this.props.homeState.documentLinks.length + " IntelligenceBank links."
            ) : null,
            this.props.homeState.activeTab == "Files" || this.props.homeState.activeTab == "Search" ? React.createElement(
                "p",
                null,
                "Click image to place it into your working document."
            ) : null
        );
    }
});


var Paginator = React.createClass({
    displayName: "Paginator",


    render: function render() {
        var _this = this;
        var totalItems = this.props.totalItems;

        var totalPages = Math.ceil(totalItems / _totalPageItems);

        var buttonClass = "btn btn_paginator hand_cursor";
        return React.createElement(
            "div", {
                className: "paginator"
            },
            React.createElement(
                "button", {
                    className: buttonClass,
                    disabled: this.props.activePage == 0 || this.props.homeState.requestsPending != 0,
                    onClick: function onClick() {
                        _this.props.setActivePage(0)
                    }
                },
                "First"
            ),
            React.createElement(
                "button", {
                    className: buttonClass,
                    disabled: this.props.activePage == 0 || this.props.homeState.requestsPending != 0,
                    onClick: function onClick() {
                        _this.props.setActivePage(Math.max(_this.props.activePage - 1, 0))
                    }
                },
                "Previous"
            ),
            React.createElement(
                "p",
                null,
                "Page " + (this.props.activePage + 1) + " / " + totalPages
            ),
            React.createElement(
                "button", {
                    className: buttonClass,
                    disabled: this.props.activePage == (totalPages - 1) || this.props.homeState.requestsPending != 0,
                    onClick: function onClick() {
                        _this.props.setActivePage(Math.min(_this.props.activePage + 1, totalPages - 1))
                    }
                },
                "Next"
            ),
            React.createElement(
                "button", {
                    className: buttonClass,
                    disabled: this.props.activePage == (totalPages - 1) || this.props.homeState.requestsPending != 0,
                    onClick: function onClick() {
                        _this.props.setActivePage(totalPages - 1)
                    }
                },
                "Last"
            )
        );
    }
});

var DocumentBar = React.createClass({
    displayName: "DocumentBar",

    componentDidMount: function componentDidMount() {
        $('.tooltipped').tooltip({
            delay: _tooltipDelay
        });
    },

    componentWillUpdate: function componentWillUpdate() {
        $('.tooltipped').tooltip('remove');
    },

    componentWillUnmount: function componentWillUnmount() {
        $('.tooltipped').tooltip('remove');
    },

    componentDidUpdate: function componentDidUpdate() {
        $('.tooltipped').tooltip({
            delay: _tooltipDelay
        });
    },

    render: function render() {
        var _this = this;

        var docName = this.props.homeState.documentName;
        if (this.props.homeState.documentUuid != "" && _imagesDataObj[this.props.homeState.documentUuid])
        {
            //{"versionNumber":3,"id":"Jykl","defaultIcon":"https://evgeny.intelligencebank.com/images/file-icons/indd-file-icon.png","v3Preview":"https://usprod2usv3.intelligencebank.com/api/3.0.0/6M0B/file?file_hash=c8f0b7f4182a6a83461af678822f5208&resource_uuid=2e9b10ee50274d5fbb59dc8ff991fc5f&sid=d09178bc5b17cd0b04aeb174b022ebb5&watermark_hash=6kh72k2ekqmwdpxicw6dbznfzptlarb5&action=preview&token=SFMyNTY.g2gDbQAAABZJQiBQbGF0Zm9ybSBUb2tlbiBEYXRhbgYATpZAjH4BYgABUYA.vkO-__rTA83ZCT8VA0os32yFJFJVaTV-avZScC5gqJE","autoCheckout":false,"type":"file","folder":"3bdb8b667a2b5df301c863d119cba92d","lastUpdater":"79d14d50e4f77a20ac549c1a62124196","iconType":"default","_id":"2e9b10ee50274d5fbb59dc8ff991fc5f","thumbVersionNumber":1,"preview":{"type":"image"},"matched":{"ib_uuid":["<em>2e9b10ee50274d5fbb59dc8ff991fc5f</em>"]},"lastUpdaterName":"Admin","ownerDivision":"50628e5683fd5118d9ec85b920c861df","fancyFileType":"InDesign (indd)","fancyFileSize":"1.01 MB","lastUpdateTime":"2021-08-19T15:27:19Z","creatorName":"Admin","v3Thumbnail":"https://cdn.intelligencebank.com/us/thumbnail/6M0B/c8f0b7f4182a6a83461af678822f5208/original/2e9b10ee50274d5fbb59dc8ff991fc5f_20210819T090","isPublicUser":false,"resourceAttributes":{"isBrowserNativeImage":false,"isExtensionSupportedByThePlatform":true,"isExtensionSupportedForDocument":false,"isExtensionSupportedForEmbed":false,"isExtensionSupportedForImageTransformation":false,"isExtensionSupportedForShare":false,"isPDFExtension":false,"isRawImage":false,"isVideoExtension":false},"ownerGroups":["862c695bba0e9ee25a4f7f126afb4af9"],"fileHash":"c8f0b7f4182a6a83461af678822f5208","file":{"error":0,"hash":"c8f0b7f4182a6a83461af678822f5208","name":"2e9b10ee50274d5fbb59dc8ff991fc5f_20210819T090312Z.indd","size":1060864,"tmp_name":"c8f0b7f4182a6a83461af678822f5208.indd","toS3SyncStatus":"sent","type":"application/octet-stream"},"creator":"79d14d50e4f77a20ac549c1a62124196","hasAlias":false,"description":"2e9b10ee50274d5fbb59dc8ff991fc5f_20210819T090","allowedActions":["view","publish","list","admin"],"thumbnail":"https://cdn.intelligencebank.com/us/thumbnail/6M0B/c8f0b7f4182a6a83461af678822f5208/original/2e9b10ee50274d5fbb59dc8ff991fc5f_20210819T090","hasRelatedItems":false,"folderPath":[{"_id":"02b0623f66b2c165ad4a86d1a1c1539c","name":"Resources","parent":"00000000000000000000000000000000"},{"_id":"3bdb8b667a2b5df301c863d119cba92d","name":"Folders","parent":"02b0623f66b2c165ad4a86d1a1c1539c"}],"aliasPublicUseTime":[],"name":"2e9b10ee50274d5fbb59dc8ff991fc5f_20210819T090","isPublic":true,"watermarkType":"none","createTime":"2021-08-19T09:03:12Z","assignedDate":"2021-08-19T00:00:00Z","permissions":{"view":true,"publish":true,"list":true,"admin":true}}
            
            docName = _imagesDataObj[this.props.homeState.documentUuid].name;
        }
        return this.props.homeState.documentOpened ? React.createElement(
            "div", {
                className: "project"
            },
            React.createElement(
                "div", {
                    className: "file_indd"
                },
                docName
            ),
            React.createElement(
                "div", {
                    className: "button waves-effect waves-light btn_ref hand_cursor tooltipped",
                    "data-position": "top",
                    "data-tooltip": "Check for any updates in your document (both locally and online).",
                    onClick: function onClick(event) {
                        return _this.props.updateAllDocument();
                    }
                },
                React.createElement(
                    "i", {
                        className: "material-icons left"
                    },
                    "cached"
                ),
                "Refresh"
            ),
            React.createElement(
                "div", {
                    className: "button waves-effect waves-light btn_pre hand_cursor tooltipped",
                    "data-position": "top",
                    "data-tooltip": "Click to download missing original / high resolution versions of your placed assets.",
                    onClick: function onClick(event) {
                        return _this.props.prePackageDocument();
                    }
                },
                React.createElement(
                    "i", {
                        className: "material-icons left"
                    },
                    "offline_pin"
                ),
                "Pre-Package"
            ),
            this.props.appState.hostName != "IDSN" ? React.createElement(
                "div", {
                    className: "button waves-effect waves-light btn_pre hand_cursor tooltipped",
                    "data-position": "top",
                    "data-tooltip": "Click to embed missing or pre-packaged original / high resolution versions of your placed assets.",
                    onClick: function onClick(event) {
                        return _this.props.prePackageDocumentEmbed();
                    }
                },
                React.createElement(
                    "i", {
                        className: "material-icons left"
                    },
                    "offline_pin"
                ),
                "Embed"
            ) : null
        ) : null;
    }

});



var HomeHeader = React.createClass({
    displayName: "HomeHeader",
    handleChange: function handleChange(event, attribute) {

        if (event.charCode == 13)
            return this.props.search(this.state.searchTerm);

        var newState = this.state;
        newState[attribute] = event.target.value;
        this.setState(newState);
    },
    getInitialState: function getInitialState() {
        return {
            searchTerm: ""
        };
    },

    render: function render() {

        var _this = this;
        switch (this.props.homeState.activeTab) {
            case "Folder":
            case "SelectDestination":
                return React.createElement(
                    "div", {
                        className: "header"
                    },
                    this.props.homeState.history.length == 0 ? React.createElement(
                        "div", {
                            className: "block_img_logo_small"
                        },
                        React.createElement("img", {
                            src: "./images/logo.png"
                        })
                    ) : null, // "Version 031221_1820",
                    this.props.homeState.history.length != 0 ? React.createElement(
                        "div", {
                            className: "block_home hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(true);
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "home"
                        )
                    ) : null,
                    this.props.homeState.history.length != 0 ? React.createElement(
                        "div", {
                            className: "search_arrow hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(false);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "chevron_left"
                        )
                    ) : null,
                    this.props.homeState.history.length != 0 ? React.createElement(
                        "div", {
                            className: "folder_name"
                        },
                        this.props.homeState.folderName
                    ) : null,
                    React.createElement(
                        "div", {
                            className: "search hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.tabCallback("Search");
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "search"
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "logout hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.toggleSettingsBar();//_this.props.logout();
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "more_vert"
                        )
                    )
                );

            case "Files":
                return React.createElement(
                    "div", {
                        className: "header"
                    },
                    React.createElement(
                        "div", {
                            className: "block_home hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(true);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "home"
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "search_arrow hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(false);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "chevron_left"
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "folder_name"
                        },
                        this.props.homeState.folderName
                    ),
                    React.createElement(
                        "div", {
                            className: "search hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.tabCallback("Search");
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons",

                            },
                            "search"
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "logout hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.toggleSettingsBar();//_this.props.logout();
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "more_vert"
                        )
                    )
                );
            case "Options":
                return React.createElement(
                    "div", {
                        className: "header"
                    },
                    React.createElement(
                        "div", {
                            className: "block_home hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(true);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "home"
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "search_arrow hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.tabCallback(_this.props.homeState.prevActiveTab);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "chevron_left"
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "folder_name"
                        },
                        "Settings"
                    ),
                    React.createElement(
                        "div", {
                            className: "search hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.tabCallback("Search");
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons",

                            },
                            "search"
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "logout hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.toggleSettingsBar();//_this.props.logout();
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "more_vert"
                        )
                    )
                );
            case "Search":
                return React.createElement(
                    "div", {
                        className: "header"
                    },
                    React.createElement(
                        "div", {
                            className: "block_home hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(true);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "home"
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "search_arrow hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.tabCallback(_this.props.homeState.prevActiveTab);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "chevron_left"
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "search_input"
                        },
                        React.createElement("input", {
                            type: "text",
                            placeholder: "Search this area...",
                            onChange: function onChange(event) {
                                return _this.handleChange(event, 'searchTerm');
                            },
                            onKeyPress: function onKeyPress(event) {
                                if (event.charCode == 13)
                                    return _this.props.search(_this.state.searchTerm)
                            },
                            value: this.state.searchTerm
                        })
                    ),
                    React.createElement(
                        "div", {
                            className: "search_btn hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.search(_this.state.searchTerm)
                            },
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "search"
                        )

                    )
                );
            case "Document":
                return React.createElement(
                    "div", {
                        className: "header"
                    },
                    this.props.homeState.history.length == 0 ? React.createElement(
                        "div", {
                            className: "block_img_logo_small"
                        },
                        React.createElement("img", {
                            src: "./images/logo.png"
                        })
                    ) : null,
                    this.props.homeState.history.length != 0 ? React.createElement(
                        "div", {
                            className: "block_home hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(true);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "home"
                        )
                    ) : null,
                    this.props.homeState.history.length != 0 ? React.createElement(
                        "div", {
                            className: "search_arrow hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.back(false);
                            }
                        },

                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "chevron_left"
                        )

                    ) : null,
                    this.props.homeState.history.length != 0 ? React.createElement(
                        "div", {
                            className: "folder_name"
                        },
                        this.props.homeState.folderName
                    ) : null,
                    React.createElement(
                        "div", {
                            className: "search hand_cursor"
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Search");
                                }
                            },
                            "search"
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "logout hand_cursor",
                            onClick: function onClick(event) {
                                return _this.props.toggleSettingsBar();
                            }
                        },
                        React.createElement(
                            "i", {
                                className: "material-icons"
                            },
                            "more_vert"
                        )
                    )
                );
        }
    }
});

var NavBar = React.createClass({
    displayName: "NavBar",



    render: function render() {
        var _this = this;
        var totalFiles = this.props.homeState.gridData.resource.length;
        var totalFolders = this.props.homeState.gridData.folder.length;

        if (_folderInfo[this.props.homeState.folderUuid]) {
            totalFolders = _folderInfo[this.props.homeState.folderUuid].folders;
            totalFiles = _folderInfo[this.props.homeState.folderUuid].resources;
        }
        
        if(this.props.homeState.folderUuid=="" && _folderInfo["root"])
            totalFolders = _folderInfo["root"].folders;

        switch (this.props.homeState.activeTab) {
            case "SelectDestination":
                return React.createElement(
                    "div", {
                        className: "navigation row"
                    },
                    React.createElement(
                        "div", {
                            className: "block_docs select_destination_text"
                        },
                        React.createElement(
                            "p",
                            null,
                            "Select destination folder for this document"
                        )
                    )
                )
                break;
            case "Folder":
            case "Options":
                return React.createElement(
                    "div", {
                        className: "navigation row"
                    },
                    React.createElement(
                        "div", {
                            className: "block_docs"
                        },
                        this.props.homeState.history.length == 0 ? React.createElement(
                            "a", {
                                href: "#",
                                className: "active hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Folder");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Folders"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFolders
                            )
                        ) : null,
                        this.props.homeState.history.length == 0 ? null : React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Files");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Files"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFiles
                            )
                        ),
                        this.props.homeState.history.length != 0 ? React.createElement(
                            "a", {
                                href: "#",
                                className: "active hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Folder");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Sub-Folders"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFolders
                            )
                        ) : null,
                        React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Document");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "My Document"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                this.props.homeState.documentLinks.length
                            )
                        )
                    )
                );

            case "Files":
                return React.createElement(
                    "div", {
                        className: "navigation row"
                    },
                    React.createElement(
                        "div", {
                            className: "block_docs"
                        },
                        this.props.homeState.history.length == 0 ? React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Folder");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Folders"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFolders
                            )
                        ) : null,
                        React.createElement(
                            "a", {
                                href: "#",
                                className: "active hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Files");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Files"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFiles
                            )
                        ),
                        this.props.homeState.history.length != 0 ? React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Folder");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Sub-Folders"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFolders
                            )
                        ) : null,
                        React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Document");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "My Document"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                this.props.homeState.documentLinks.length
                            )
                        )
                    )
                );
            case "Search":
                return React.createElement(
                    "div", {
                        className: "navigation row"
                    },
                    React.createElement(
                        "div", {
                            className: "block_docs"
                        },
                        React.createElement(
                            "a", {
                                href: "#"
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Search Results"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                this.props.homeState.searchGridData.length
                            )
                        )
                    )
                );
            case "Document":
                return React.createElement(
                    "div", {
                        className: "navigation row"
                    },
                    React.createElement(
                        "div", {
                            className: "block_docs"
                        },
                        this.props.homeState.history.length == 0 ? React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Folder");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Folders"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFolders
                            )
                        ) : null,
                        this.props.homeState.history.length == 0 ? null : React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Files");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Files"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFiles
                            )
                        ),
                        this.props.homeState.history.length != 0 ? React.createElement(
                            "a", {
                                href: "#",
                                className: "hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.props.tabCallback("Folder");
                                }
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "Sub-Folders"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                totalFolders
                            )
                        ) : null,
                        React.createElement(
                            "a", {
                                href: "#",
                                className: "active"
                            },
                            React.createElement(
                                "nobr",
                                null,
                                "My Document"
                            ),
                            React.createElement(
                                "span", {
                                    className: "bullet"
                                },
                                this.props.homeState.documentLinks.length
                            )
                        )
                    )
                );
        }
    }
});

var Grid = React.createClass({
    displayName: "Grid",


    render: function render() {
        return React.createElement(
            "div", {
                className: this.props.homeState.activeTab == "Document" ? "items" : "files"
            },
            React.createElement(
                "div", {
                    className: "row"
                },
                this.props.selectFolderCells,
                this.props.folderCells,
                this.props.imageCells,
                this.props.linkCells
            )
        );
    }
});

var LinkCard = React.createClass({
    displayName: "LinkCard",

    componentDidMount: function componentDidMount() {
        $('.tooltipped').tooltip({
            delay: _tooltipDelay
        });
    },

    render: function render() {
        var _this = this;

        var hdTooltip = "The original / high resolution version of this asset has already been downloaded.";

        if (this.props.isEmbedded)
            hdTooltip = "The original / high resolution version of this asset has already been embedded.";

        return React.createElement(
            "div", {
                className: "item_box col s6 m4 l3"
            },
            React.createElement(
                "div", {
                    className: "img_box"
                },
                React.createElement("object", {
                        data: this.props.image,
                        type: "image/png"
                    },
                    React.createElement("img", {
                        src: "./images/file_fallback_icon.png"
                    })
                )
            ),
            React.createElement(
                "div", {
                    className: "text_box"
                },
                React.createElement(
                    "p", {
                        className: "file_name"
                    },
                    this.props.name
                ),
                React.createElement(
                    "p", {
                        className: "file_param"
                    },
                    this.props.description
                )
            ),
            React.createElement(
                "div", {
                    className: "icon_box"
                },
                React.createElement(
                    "i", {
                        className: this.props.isPreview ? "material-icons disable tooltipped hand_cursor" : "material-icons tooltipped hand_cursor",
                        "data-position": "top",
                        "data-tooltip": this.props.isPreview ? "Click Pre-Package to download the high resolution version of this file as an external linked layer, or Embed to embed it into the document." : hdTooltip
                    },
                    "offline_pin"
                ),
                this.props.deleted ? React.createElement(
                    "i", {
                        className: "material-icons tooltipped hand_cursor",
                        "data-position": "top",
                        "data-tooltip": "File deleted or permission missing.",
                    },
                    "delete"
                ) : null
            )
        );
    }

});

var SelectFolderCard = React.createClass({
    displayName: "SelectFolderCard",

    render: function render() {
        var _this = this;
        return React.createElement(
            "div", {
                className: (!this.props.perm.admin && !this.props.perm.publish) ? "col s6 m4 l3 valign-wrapper block_topfolder_item grayedSelectFolder" : "col s6 m4 l3 valign-wrapper block_topfolder_item"
            },

            React.createElement(
                "a", {
                    className: "hand_cursor",
                    href: "#"

                },
                React.createElement(
                    "div", {
                        className: "row"
                    },
                    React.createElement(
                        "div", {
                            className: "block_img valign-wrapper"
                        },

                        React.createElement(
                            "div", {
                                className: "img_container"
                            },
                            React.createElement("object", {
                                    data: this.props.image,
                                    type: "image/png"
                                },
                                React.createElement("img", {
                                    src: "./images/folder_fallback_icon.png"
                                })
                            )
                        )
                    ),


                    React.createElement(
                        "div", {
                            className: "block_descript"
                        },
                        React.createElement(
                            "h3", {
                                onClick: function onClick(event) {
                                    if (_this.props.folders != 0)
                                        return _this.props.openFolder(_this.props.uuid, _this.props.name)
                                }
                            },
                            this.props.name
                        ),
                        this.props.folders != 0 ? React.createElement(
                            "p",
                            null,
                            this.props.folders,
                            " sub-folders"
                        ) : null,
                        this.props.perm.admin || this.props.perm.publish ? React.createElement("input", {
                            type: "checkbox",
                            className: "checkbox-green filled-in",
                            id: "cb" + this.props.uuid,
                            checked: (this.props.uuid == this.props.selectedFolderUuid),
                            onClick: function onClick(event) {
                                if (_this.props.uuid != _this.props.selectedFolderUuid) return _this.props.selectFolder(_this.props.uuid);
                                else return _this.props.selectFolder("");
                            }
                        }) : null,
                        this.props.perm.admin || this.props.perm.publish ? React.createElement(
                            "label", {
                                "htmlFor": "cb" + this.props.uuid
                            },
                            ""
                        ) : null
                    )
                )
            )
        );
    }
});

var FolderCard = React.createClass({
    displayName: "FolderCard",

    render: function render() {
        var _this = this;
        return React.createElement(
            "div", {
                className: "col s6 m4 l3 valign-wrapper block_topfolder_item"

            },
            React.createElement(
                "a", {
                    className: "hand_cursor",
                    href: "#",
                    onClick: function onClick(event) {
                        
                        return _this.props.onClick(_this.props.uuid, _this.props.name, _this.props.folders, _this.props.images);
                    }
                },
                React.createElement(
                    "div", {
                        className: "row"
                    },
                    React.createElement(
                        "div", {
                            className: "block_img valign-wrapper"
                        },

                        React.createElement(
                            "div", {
                                className: "img_container"
                            },
                            React.createElement("object", {
                                    data: this.props.image,
                                    type: "image/png"
                                },
                                React.createElement("img", {
                                    src: "./images/folder_fallback_icon.png"
                                })
                            )
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "block_descript"
                        },
                        React.createElement(
                            "h3",
                            null,
                            this.props.name
                        ),
                        this.props.folders != 0 ? React.createElement(
                            "p",
                            null,
                            this.props.folders,
                            " sub-folders"
                        ) : null,
                        this.props.images != 0 ? React.createElement(
                            "p",
                            null,
                            this.props.images,
                            " assets"
                        ) : null
                    )
                )
            )
        );
    }
});

var ImageCard = React.createClass({
    displayName: "ImageCard",

    componentDidMount: function componentDidMount() {
        $('.tooltipped').tooltip({
            delay: _tooltipDelay
        });
    },

/*
When Resource is "checkout": true, a lock icon appears in alert red color on the Resource listed in the Folder. On hover, a tooltip comes up: "Resource checked out by {{checkoutUserName}} on {{checkoutTime}}.

{{checkoutUserName}} and {{checkoutTime}} will be added to the response next week. Details to test on our staging environment are in the comments below.

This is the data to expect in the response:

"checkout": true
"checkoutUserName": "IntelligenceBank Product",
"checkoutTime": "2021-11-18T17:54:32Z",

Question: can the time display be automatically adjusted to the timezone of the user based on their system settings?

Example of a "checkout":true resource on evgeny.intelligencebank.com is in the Stock Photography folder (young fitness woman..., 519ef9f648413c673be6486bb99a94b1)
    */
    
    render: function render() {
        var _this = this;
        var mainClassName = "col s4 m3 l2 block_file_item center-align";
        var tipText = "Click to place a preview of this asset into your document.";

        if (this.props.disabled) {
            mainClassName += " disable_block";
            tipText = "File format not supported for placement.";
        }
        //  else mainClassName+=" hand_cursor";

        return React.createElement(
            "div", {
                className: mainClassName,

            },
            
            this.props.checkout ?  React.createElement(
                "i", {
                    className: "material-icons tooltipped hand_cursor",
                    style:{color: "#E40000", position: "absolute", top:0, right:0},
                    "data-position": "top",
                    "data-tooltip": "Resource checked out by "+this.props.checkoutUserName+" on "+convertDate(this.props.checkoutTime)
                },
                "lock_outline"
            ) : null,
            
            React.createElement(
                "div", {
                    className: "img_container"
                },
                React.createElement("object", {
                        data: this.props.image,
                        type: "image/png",
                        style:{background: "url(./images/checkered-background.png) repeat"}
                    },
                    React.createElement("img", {
                        src: "./images/file_fallback_icon.png"
                    })
                )
            ),

            React.createElement(
                "h3",
                null,
                this.props.name
            ),
            React.createElement(
                "p",
                null,
                this.props.description
            ),
            React.createElement(
                "button", {
                    className: "btn btn_imageCard btn_imageCard_open waves-effect waves-light hand_cursor",
                    disabled: !this.props.useOpen,
                    onClick: this.props.useOpen ? function onClick(event) {
                        return _this.props.openFile(_this.props.uuid)
                    } : null
                },
                "Open"
            ),
            React.createElement(
                "button", {
                    className: "btn btn_imageCard btn_imageCard_place waves-effect waves-light hand_cursor",
                    disabled: !this.props.usePlace,
                    onClick: this.props.usePlace ? function onClick(event) {
                        return _this.props.placeFile(_this.props.uuid)
                    } : null
                },
                "Place"
            )
        );
    }
});

var LoginScreen = React.createClass({
    displayName: "LoginScreen",

    componentDidMount: function componentDidMount() {
        Materialize.updateTextFields();
    },


    handleSubmit: function handleSubmit(event) {
        event.preventDefault();
        var newState = this.state;
        if (this.state.company == "") {
            var loginError = "A valid Platform URL is required.";
            this.props.updateAppState({loginError:loginError});
            return;
        }


        newState.requestInProcess = true;
        this.setState(newState);
        getApiUrl(this.state.company, this.apiCallback, this.state.isCustomURL);
    },
    
    browserLoginPressed: function browserLoginPressed() {
        if(this.state.company=="") 
		{
			var loginError = "A valid Platform URL is required.";
			this.props.updateAppState({loginError:loginError});
			return;
		}
        var url = this.state.company;
        if(!this.state.isCustomURL)
            url+=".intelligencebank.com";
        this.props.updateAppState({company:this.state.company,isCustomURL:this.state.isCustomURL});
        
        getToken(url,this.getTokenCallback);
       
    },

    getTokenCallback: function getTokenCallback(data) {
        
        if (data.error || data.body.message != undefined) {
            var loginError = "A valid Platform URL is required.";
            if (data.error == "Timeout")
                var loginError = "You are not connected to the internet.";
            
            this.props.updateAppState({loginError:loginError});
            return;
        }
     
        var url = this.state.company;
        if(!this.state.isCustomURL)
            url+=".intelligencebank.com";
        
        var csInterface = new CSInterface();
     
        csInterface.openURLInDefaultBrowser("https://"+url+"/auth/?login=1&token="+data.body.content);
        
        this.props.updateAppState({activeScreen:"BrowserLogin",token:data.body.content});
    },
    
    apiCallback: function apiCallback(data) {
        var newState = this.state;
        newState.requestInProcess = true;
        if (data.error || data.body.message != undefined) {
            var loginError = "The requested URL was not found.";
            if (data.error == "Timeout")
                var loginError = "You are not connected to the internet.";
            
            newState.requestInProcess = false;
            this.setState(newState);
            this.props.updateAppState({loginError:loginError});
            return;
        }
        newState.apiUrl = data.body.content.replace("http://", "").replace("https://", "");

        this.setState(newState);

        auth(this.state.username, this.state.password, this.state.company, newState.apiUrl, this.authCallback);
    },

    authCallback: function authCallback(data) {
       
        /*
          {"clientname":"IntelligenceBank BrandHub Demo","clientuuid":"5bb0a472e962b96cbfa426868f6c4806","apikey":"75cc197a81565d43addd7e6af1119b83","logintimeoutperiod":1,"adminemail":"apiusdemo@intelligencebank.Com","passwordexpiryperiod":null,"userverificationperiod":null,"offlineexpiryperiod":1,"annotations":"Advanced","comments":"1","passwordexpired":null,"emailexpired":null,"versions":"1","firstname":"IntelligenceBank","lastname":"API","useruuid":"02e8c3a13e903fb74754ca9a3e6fd344","thumbnail":"/uploads/5bb0a472e962b96cbfa426868f6c4806/auto/300x300-t4-02e8c3a13e903fb74754ca9a3e6fd344.png","foldericon":"6319c138c98702a24f099b12bf9496c6","rowsOnPage":"100","colourPrimary":"#000000","colourPrimaryText":"#FFFFFF","colourSecondary":"#79BB53","colourSecondaryText":"#FFFFFF","colourHighlight":"#81C452","enableMasterSync":"0","enableCustomBranding":"1","enableAnnotations":"1","enableImageReader":"1","enableAppOpenIn":"1","isResourceMainAdmin":true,"toolNameMapping":{"resource":{"menu":"Creative Library","module":"Resources"},"agenda":{"menu":"","module":null}},"defaultFolderSortOrder":"sortorder"}
        
The following parameters returned in the response are to be used for subsequent V3 calls:
“apiV3url”
“clientid”
“sid” (in headers)
        
        {"clientname":"The IntelligenceBank Trial","clientuuid":"70a09b98acf1471b74801b87cf0aed06","clientid":"6M0B","sid":"p5jh5vqth96bo2bhnhbe7o8931","apikey":"4328294b9fafd03ed28ba85c02947829","apiV3url":"https://lbv3us1.intelligencebank.com","logintimeoutperiod":120,"adminemail":"evgenytr@gmail.com","passwordexpiryperiod":null,"userverificationperiod":null,"offlineexpiryperiod":120,"annotations":"Advanced","comments":"1","passwordexpired":null,"emailexpired":null,"versions":"1","firstname":"Evgeny","lastname":"Trefilov","useruuid":"02e8c3a13e903fb74754ca9a3e6fd344","thumbnail":"/uploads/70a09b98acf1471b74801b87cf0aed06/auto/300x300-t7-02e8c3a13e903fb74754ca9a3e6fd344.png","foldericon":"72b777c2e4913b707bbd07fcedcc4634","rowsOnPage":"100","colourPrimary":"#FFFFFF","colourPrimaryText":"#525151","colourSecondary":"#525151","colourSecondaryText":"#FFFFFF","colourHighlight":"#F68D32","enableMasterSync":"0","enableCustomBranding":"1","enableAnnotations":"1","enableImageReader":"1","enableAppOpenIn":"1","enableAgenda":0,"isResourceMainAdmin":true,"toolNameMapping":{"resource":{"menu":"Assets","module":"Resources"}},"defaultFolderSortOrder":"sortorder"}
          */

        var newState = this.state;
        newState.requestInProcess = false;

        if (data.error || data.body.message != undefined) {
            var loginError = "Your login details are incorrect or your account has been locked. Please try again or go to your login page to reset your password.";
            if (data.error == "Timeout")
                var loginError = "You are not connected to the internet.";
            this.props.updateAppState({loginError:loginError});
            this.setState(newState);
            return;
        }



        /*
  $.ajax({
      url:"https://"+this.state.apiUrl+"/webapp/1.0/login?p60=0db17b942ed391096168f41f90051acc&p70=" + encodeURIComponent(this.state.username) + "&p80=" + encodeURIComponent(this.state.password) + "&p90=" + platformUrl(this.state.company),
  method:"GET",
  error:function(a,b,c){},
  success:function(a,b,c){}
});
*/
        newState.loginError = "";
        newState.activeScreen = "Home";
        newState.apiKey = data.body.apikey;
        newState.apiUrl = data.body.apiV3url;
        //newState.userUuid = data.body.useruuid;
        newState.userUuid = data.body.clientid;
        //newState.sessionKey = data.response.headers["set-cookie"][0];
        newState.sessionKey = data.body.sid;
        newState.defaultFolderSortOrder = data.body.defaultFolderSortOrder;
        // newState.isCustomURL = this.state.isCustomURL;
        _useCustomUrl = this.state.isCustomURL;

        savePrefs({
            username: this.state.username,
            company: this.state.company,
            apiUrl:this.state.apiUrl,
            apiKey:this.state.apiKey,
            sessionKey:this.state.sessionKey,
            userUuid:this.state.userUuid,
            isCustomURL: this.state.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
        });

        //   myAlert(JSON.stringify(data.response.headers["set-cookie"]));
        this.props.logoutCallback(data.body.logintimeoutperiod);

        this.props.updateAppState(newState);
    },

    handleChange: function handleChange(event, attribute) {
        var newState = this.state;
        newState[attribute] = event.target.value;
        this.setState(newState);
    },

    toggleCustomUrl: function() {
        var newState = this.state;
        newState.isCustomURL = !newState.isCustomURL;
        _useCustomUrl = newState.isCustomURL;

        savePrefs({
            username: this.state.username,
            company: this.state.company,
            apiUrl:this.state.apiUrl,
            apiKey:this.state.apiKey,
            sessionKey:this.state.sessionKey,
            userUuid:this.state.userUuid,
            isCustomURL: newState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
        });

        this.setState(newState);
    },

    getInitialState: function getInitialState() {

       
        var initialState = {
            username: "",
            password: "",
            company: "",
            apiUrl: "",
            sessionKey: "",
            apiKey: "",
            requestInProcess: false,
            defaultFolderSortOrder: "sortorder",
            isCustomURL: false
        };
        
        var prefsData = readPrefs();
        if (prefsData) {
            for (var prop in prefsData)
                if (prefsData[prop]!=undefined) initialState[prop] = prefsData[prop];

            _useCustomUrl = initialState.isCustomURL;
            apiUrl = "";
            sessionKey = "";
            apiKey = "";
            userUuid = "";
        }

       
        
        return initialState;
    },

    render: function render() {
        var _this = this;

        return React.createElement(
            "div", {
                className: "bg_black"
            },
            this.state.requestInProcess ? React.createElement(CircularPreLoader, null) : null,
            React.createElement(
                "div", {
                    className: "form_body"
                },
                React.createElement(
                    "div", {
                        className: "row"
                    },
                    React.createElement(
                        "div", {
                            className: "col s12 block_img_logo"
                        },
                        React.createElement("img", {
                            className: "img_logo",
                            src: "./images/logo.png"
                        })
                    )
                ),
                React.createElement(
                    "div", {
                        className: "row block_login"
                    },
                    React.createElement(
                        "p",
                        null,
                        " Login to your IntelligenceBank DAM account by entering your credentials below."
                    )
                ),
                this.props.appState.loginError != "" ? React.createElement(IncorrectLoginWarning, {
                    errorMessage: this.props.appState.loginError
                }) : null,

                React.createElement(
                    "form", {
                        className: "block_form",
                        onSubmit: this.handleSubmit
                    },
                    React.createElement(
                        "div", {
                            className: "row form_line"
                        },
                        React.createElement(
                            "div", {
                                className: "col s2 pre_post"
                            },
                            "https://"
                        ),
                        React.createElement(
                            "div", {
                                className: this.state.isCustomURL ? "input-field col s10" : "input-field col s6",
                                style: {
                                    padding: 0
                                }
                            },
                            React.createElement("input", {
                                placeholder: this.state.isCustomURL ? "platformurl" : "mycompany",
                                id: "company_name",
                                type: "text",
                                className: "validate",
                                onChange: function onChange(event) {
                                    return _this.handleChange(event, 'company');
                                },
                                value: this.state.company
                            }),
                            React.createElement(
                                "label", {
                                    htmlFor: "company_name",
                                    className: "PlatformURL"
                                },
                                "Platform URL"
                            )
                        ),
                        this.state.isCustomURL ? null : React.createElement(
                            "div", {
                                className: "col s4 pre_post",
                                style: {
                                    padding: 0
                                }
                            },
                            ".intelligencebank.com"
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "row"
                        },
                        React.createElement(
                            "div", {
                                className: "input-field col s12"
                            },
                            React.createElement("input", {
                                id: "username",
                                type: "text",
                                className: "validate",
                                onChange: function onChange(event) {
                                    return _this.handleChange(event, 'username');
                                },
                                value: this.state.username
                            }),
                            React.createElement(
                                "label", {
                                    htmlFor: "username"
                                },
                                "Username"
                            )
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "row"
                        },
                        React.createElement(
                            "div", {
                                className: "input-field col s12"
                            },
                            React.createElement("input", {
                                id: "password",
                                type: "password",
                                className: "validate",
                                onChange: function onChange(event) {
                                    return _this.handleChange(event, 'password');
                                },
                                value: this.state.password
                            }),
                            React.createElement(
                                "label", {
                                    htmlFor: "password"
                                },
                                "Password"
                            )
                        )
                    ),
                    React.createElement(
                        "div", {
                            className: "row"
                        },
                        React.createElement(
                            "div", {
                                className: "input-field col s12 block_button"
                            },
                            React.createElement(
                                "button", {
                                    className: "waves-effect waves-light btn hand_cursor"
                                },
                                "Login"
                            )
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "row"
                        },
                        React.createElement(
                            "div", {

                                className: "col s12 customUrlLine hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.toggleCustomUrl();
                                },
                            },
                            this.state.isCustomURL ? "IntelligenceBank URL" : "Custom URL"
                        )

                    ),
                    React.createElement(
                        "div", {
                            className: "row"
                        },
                        React.createElement(
                            "div", {

                                className: "col s12 customUrlLine hand_cursor",
                                onClick: function onClick(event) {
                                    return _this.browserLoginPressed();
                                },
                            },
                            "Browser Login (For SSO)"
                        )
                    )
                )
            )
        );
    }
});

var IncorrectLoginWarning = React.createClass({
    displayName: "IncorrectLoginWarning",
    render: function render() {
        return React.createElement(
            "div", {
                className: "row block_relogin"
            },
            React.createElement(
                "div", {
                    className: "valign-wrapper"
                },
                React.createElement(
                    "i", {
                        className: "material-icons"
                    },
                    "report_problem"
                ),
                React.createElement(
                    "p",
                    null,
                    this.props.errorMessage
                )
            )
        );
    }
});


var BrowserLoginScreen = React.createClass({
    displayName: "BrowserLoginScreen",
    
    getInitialState: function getInitialState() {

        var initialState = {
            loginError: false
        };

        return initialState;
    },
    
    backPressed: function backPressed() {
        this.props.updateAppState({activeScreen:"Login"});
    },
    
    continuePressed: function continuePressed() {

        var url = this.props.appState.company;
        if(!this.props.appState.isCustomURL)
            url+=".intelligencebank.com";
        
        getKey(url,this.props.appState.token,this.continueCallback);

    },
    
    continueCallback: function continueCallback(data)
    {
       
        //alert(JSON.stringify(data));
      
        if(data.error || !data.body.content || !data.body.content.session || !data.body.content.session.sid) {
            this.props.updateAppState({activeScreen:"Login",loginError:"You are not currently authenticated via the browser. Click the Browser Login (For SSO) link below to try again."});
            return;
        };
        
        
       /* {'SID':'d159f8e62ad13decd85b40245e20062c','content':{'session':{'sid':'a303f11aac858803fd96435b8869051f','userUuid':'104bd05973d890dce595455822ac452a','originalUserUuid':null,'loginTime':1609227014},'info':{'clientname':'The IntelligenceBank Trial','clientuuid':'70a09b98acf1471b74801b87cf0aed06','clientid':'6M0B','sid':'a303f11aac858803fd96435b8869051f','apikey':'4328294b9fafd03ed28ba85c02947829','apiV3url':'https://usprod2usv3.intelligencebank.com','logintimeoutperiod':120,'adminemail':'evgenytr@gmail.com','passwordexpiryperiod':null,'userverificationperiod':null,'offlineexpiryperiod':120,'annotations':'Advanced','comments':'1','passwordexpired':null,'emailexpired':null,'versions':'0','firstname':'Permission','lastname':'User','useruuid':'104bd05973d890dce595455822ac452a','thumbnail':'/uploads/70a09b98acf1471b74801b87cf0aed06/auto/300x300-t2-104bd05973d890dce595455822ac452a.png','foldericon':'72b777c2e4913b707bbd07fcedcc4634','rowsOnPage':'100','colourPrimary':'#FFFFFF','colourPrimaryText':'#525151','colourSecondary':'#525151','colourSecondaryText':'#FFFFFF','colourHighlight':'#F68D32','enableMasterSync':'0','enableCustomBranding':'1','enableAnnotations':'1','enableImageReader':'1','enableAppOpenIn':'1','enableAgenda':0,'isResourceMainAdmin':false,'toolNameMapping':{'resource':{'menu':'Assets','module':'Resources'}},'defaultFolderSortOrder':'sortorder'}}}
        */
   
        var apiKey = data.body.content.info.apikey;
        var sessionKey = data.body.content.session.sid;
        this.props.updateAppState({apiKey:apiKey,sessionKey:sessionKey,userUuid:data.body.content.info.clientid, apiUrl:data.body.content.info.apiV3url});
        //getApiUrl(this.props.appState.company, this.apiCallback, this.props.appState.isCustomURL);
        savePrefs({
            username: this.props.appState.username,
            company: this.props.appState.company,
            apiUrl:this.props.appState.apiUrl,
            apiKey:this.props.appState.apiKey,
            sessionKey:this.props.appState.sessionKey,
            userUuid:this.props.appState.userUuid,
            isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
        });
       
        this.props.updateAppState({activeScreen:"Home"});
        
    
    },
    
    apiCallback: function apiCallback(data) {
        
        
        if (data.error || data.body.message != undefined) {
            var loginError = "The requested URL was not found.";
            if (data.error == "Timeout")
                var loginError = "You are not connected to the internet.";
            
            this.setState(newState);
            this.props.updateAppState({loginError:loginError,activeScreen:"Login"});
            return;
        }
      
        
        var apiUrl = data.body.content.replace("http://", "").replace("https://", "");
        
        //save to prefs
        savePrefs({
            username: this.props.appState.username,
            company: this.props.appState.company,
            apiUrl:apiUrl,
            apiKey:this.props.appState.apiKey,
            sessionKey:this.props.appState.sessionKey,
            userUuid:this.props.appState.userUuid,
            isCustomURL: this.props.appState.isCustomURL,
            placeOriginals:this.props.appState.placeOriginals,
            showPlaceOptions:this.props.appState.showPlaceOptions,
            hideUnsupported:this.props.appState.hideUnsupported,
            customFolder:this.props.appState.customFolder,
            useCustomFolder:this.props.appState.useCustomFolder
        });
       
        this.props.updateAppState({apiUrl:apiUrl,activeScreen:"Home"});
    },
    
    render: function render() {
        var _this = this;
        
        return React.createElement(
            "div", {
                className: "bg_black"
            },
            React.createElement(
                "div", {
                    className: "form_body"
                },
                React.createElement(
                    "div", {
                        className: "row"
                    },
                    React.createElement(
                        "div", {
                            className: "col s12 block_img_logo"
                        },
                        React.createElement("img", {
                            className: "img_logo",
                            src: "./images/logo.png"
                        })
                    )
                ),
                React.createElement(
                    "div", {
                        className: "row block_login",
                        style:{paddingTop:40}
                    },
                    React.createElement(
                        "p",
                        null,
                        "Once your are logged in via the browser, click ",
                        React.createElement(
                            "b",
                            null,
                            "Continue"
                        ),
                        ". To return to the standard Login page, click ",
                        React.createElement(
                            "b",
                            null,
                            "Back"
                        ),
                        "."
                    )
                ), 
                    React.createElement(
                        "div", {
                            className: "row",
                            style:{paddingTop:40}
                        },
                        React.createElement(
                            "div", {
                                className: "input-field col s12 block_button"
                            },
                            React.createElement(
                                "button", {
                                    className: "waves-effect waves-light btn hand_cursor",
                                    style:{marginRight:40},
                                    onClick: function onClick(event) {
                                        return _this.backPressed();
                                    },
                                },
                                "Back"
                            ),
                            React.createElement(
                                "button", {
                                    className: "waves-effect waves-light btn hand_cursor",
                                    onClick: function onClick(event) {
                                        return _this.continuePressed();
                                    },
                                },
                                "Continue"
                            )
                        )

                    )
            )
        );
        
    }
});


var SettingsBar = React.createClass({
    displayName: "SettingsBar",
    
    render: function render() {
        var _this = this;
    
        return React.createElement(
            "div", {
                className: "settingsBar"
            },
            React.createElement(
                        "div", {
                            className: this.props.activeTab == "Options" ? "settingsCell active" : "settingsCell",
                            onClick: function onClick(event)
                            {
                                _this.props.tabCallback("Options");
                            }
                        },
                        React.createElement(
                            "p",
                            null,
                            React.createElement(
                                "i", {
                                    className: "material-icons"
                                },
                                "build"
                            ),
                            "Settings"
                        )
                    ),
                    React.createElement(
                                "div", {
                                    className: "settingsCell",
                                    onClick: function onClick(event)
                                    {
                                        _this.props.logout();
                                    }
                                },
                                React.createElement(
                                    "p",
                                    null,
                                React.createElement(
                                    "i", {
                                        className: "material-icons"
                                    },
                                    "input"
                                ),
                                "Logout"
                                )
                               
                    )
        );
    }
});


        
        
var SettingsScreen = React.createClass({
    displayName: "SettingsScreen",
    
    toggleCb: function(prop) {
        var updateObj = {hideUnsupported:this.props.appState.hideUnsupported,
        placeOriginals:this.props.appState.placeOriginals,
        showPlaceOptions:this.props.appState.showPlaceOptions,
        useCustomFolder:this.props.appState.useCustomFolder,
        customFolder:this.props.appState.customFolder};
        
        switch(prop)
        {
        case "hideUnsupported":
            updateObj.hideUnsupported=!this.props.appState.hideUnsupported;
            break;
        case "placeOriginals":
            updateObj.placeOriginals=!this.props.appState.placeOriginals;
            updateObj.showPlaceOptions = false;
            break;
        case "showPlaceOptions":
            updateObj.showPlaceOptions=!this.props.appState.showPlaceOptions;
            break;
        case "useCustomFolder":
            updateObj.useCustomFolder=!this.props.appState.useCustomFolder;
            break;
        }
        
        savePrefs({
            username: this.props.appState.username,
            company: this.props.appState.company,
            apiUrl:this.props.appState.apiUrl,
            apiKey:this.props.appState.apiKey,
            sessionKey:this.props.appState.sessionKey,
            userUuid:this.props.appState.userUuid,
            isCustomURL: this.props.appState.isCustomURL,
        placeOriginals:updateObj.placeOriginals,
        showPlaceOptions:updateObj.showPlaceOptions,
        hideUnsupported:updateObj.hideUnsupported,
            useCustomFolder:updateObj.useCustomFolder,
            customFolder:this.props.appState.customFolder
        });
        
        this.props.updateAppState(updateObj);
    },

    selectPressed: function(attribute)
    {
        var a = window.cep.fs.showOpenDialogEx(false, true, "Please choose folder");
        
        if(!a.data.length) return;
        var folderPath = a.data[0];
        var myObj = {};
        myObj[attribute] = folderPath;
        this.props.updateAppState(myObj);
        
        savePrefs({
            username: this.props.appState.username,
            company: this.props.appState.company,
            apiUrl:this.props.appState.apiUrl,
            apiKey:this.props.appState.apiKey,
            sessionKey:this.props.appState.sessionKey,
            userUuid:this.props.appState.userUuid,
            isCustomURL: this.props.appState.isCustomURL,
        placeOriginals:this.props.appState.placeOriginals,
        showPlaceOptions:this.props.appState.showPlaceOptions,
        hideUnsupported:this.props.appState.hideUnsupported,
            useCustomFolder:this.props.appState.useCustomFolder,
            customFolder:myObj.customFolder
        });
        
    },
    
    render: function render() {
        var _this = this;
        
        
        
        return React.createElement(
            "div", {
                className: "settings"
            },/*
            React.createElement(
                            "h2",
                            null,
                            "Hide Unsupported Files"
                        ),
            React.createElement(
                "p",
                null,
                "Unsupported files from the Adobe application can be either disabled (default), or entirely hidden. Note that the Folder count will still include them."
            ),
            React.createElement("input", {
                type: "checkbox",
                className: "checkbox-green filled-in",
                id: "cbHideUnsupported",
                checked: this.props.appState.hideUnsupported,
                onClick: function onClick(event) {
                    _this.toggleCb("hideUnsupported");
                }
            }),
            React.createElement(
                "label", {
                    "htmlFor": "cbHideUnsupported"
                },
                ""
            ),*/
           this.props.appState.hostName!="PHSP" && this.props.appState.hostName !="PHXS" ? React.createElement(
                            "h2",
                            null,
                             "Always Place Original"
                        ) : null,
            this.props.appState.hostName!="PHSP" && this.props.appState.hostName !="PHXS" ? React.createElement(
                "p",
                null,
                 "When using the Place action to insert a file onto an opened document, a lightweight Preview image is used by default. Enable this option to always download the Original directly when placing files from the Connector."
            ) : null,
            this.props.appState.hostName!="PHSP" && this.props.appState.hostName !="PHXS" ? React.createElement("input", {
                type: "checkbox",
                className: "checkbox-green filled-in",
                id: "cbPlaceOriginals",
                checked: this.props.appState.placeOriginals,
                onClick: function onClick(event) {
                    _this.toggleCb("placeOriginals");
                }
            }): null,
            this.props.appState.hostName!="PHSP" && this.props.appState.hostName !="PHXS" ? React.createElement(
                "label", {
                    "htmlFor": "cbPlaceOriginals"
                },
                ""
            ) : null,
            
            React.createElement(
                            "h2",
                            null,
                            "Use Custom Folder For Originals"
                        ),
            React.createElement(
                "p",
                null,
                "Select the local storage location for original assets when they are downloaded."
            ),
            React.createElement("input", {
                type: "checkbox",
                className: "checkbox-green filled-in",
                id: "cbUseCustomFolder",
                checked: this.props.appState.useCustomFolder,
                onClick: function onClick(event) {
                    _this.toggleCb("useCustomFolder");
                }
            }),
            React.createElement(
                "label", {
                    "htmlFor": "cbUseCustomFolder"
                },
                ""
            ),
            
            this.props.appState.useCustomFolder ? React.createElement(
                "h2",
                null,
                "Destination Folder"
            ) : null,
            
            
            
            this.props.appState.useCustomFolder ? React.createElement(
                "div", {
                    style: {
                        padding: 0
                    }
                },
                React.createElement(
                    "button", {
                        className: "btn hand-cursor",
                        style: {
                            marginRight: 10
                        },
                        onClick:function()
                        {
                            _this.selectPressed("customFolder");
                        }
                    },
                    "Choose"
                ),
                
                this.props.appState.customFolder
               
            ) : null,
            
            
            this.props.appState.placeOriginals && this.props.appState.hostName=="IDSN" ? React.createElement(
                "h2",
                null,
                "Show Import Options On Place"
            ) : null,
            this.props.appState.placeOriginals && this.props.appState.hostName=="IDSN" ? React.createElement(
                "p",
                null,
                "When using the Place action to insert a file onto an opened document from the Connector, enable Show Import Options as per Adobe’s native functionality."
            ) : null,
            this.props.appState.placeOriginals && this.props.appState.hostName=="IDSN" ? React.createElement("input", {
                type: "checkbox",
                className: "checkbox-green filled-in",
                id: "cbShowPlaceOptions",
                checked: this.props.appState.showPlaceOptions,
                onClick: function onClick(event) {
                    _this.toggleCb("showPlaceOptions");
                }
            }) : null,
            this.props.appState.placeOriginals && this.props.appState.hostName=="IDSN" ? React.createElement(
                "label", {
                    "htmlFor": "cbShowPlaceOptions"
                },
                ""
            ) : null
        );
        
        
    }
});

function getApiUrl(companyName, apiCallback, isCustomUrl) {
    
    var hostname = companyName;
    if (!isCustomUrl) hostname += ".intelligencebank.com";
    var options = {
        hostname: hostname,
        port: 443,
        method: 'GET',
        path: "/v1/auth/app/getYapiAddress"
    };

    var authRequest = https.request(options, function(response) {

        var body = "";

        response.on('error', function(err) {

            apiCallback({
                error: err
            })
        });

        response.on('data', function(chunk) {
            body += chunk;

        });

        response.on('end', function() {
            var error = false;

            try {
                body = JSON.parse(body);
            } catch (e) {
                error = "Incorrect URL"
            }

            apiCallback({
                error: error,
                body: body,
                response: response
            })

        });

    });

    authRequest.setTimeout(_timeoutValue, function() {
        authRequest.abort();
        apiCallback({
            error: "Timeout"
        })
    });
    
    authRequest.on('error', function() {
                apiCallback({error:"Auth request error"});
            });
            
    authRequest.end();

}

function auth(username, password, companyName, apiUrl, authCallback) {

    var postData = "p60=0db17b942ed391096168f41f90051acc&p70=" + encodeURIComponent(username) + "&p80=" + encodeURIComponent(password) + "&p90=" + platformUrl(companyName);

    var options = {
        hostname: apiUrl,
        port: 443,
        method: 'POST',
        path: "/webapp/1.0/login",
        headers: {

            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    var authRequest = https.request(options, function(response) {

        var body = "";

        response.on('error', function(err) {

            authCallback({
                error: err
            })
        });

        response.on('data', function(chunk) {
            body += chunk;

        });

        response.on('end', function() {
            var error = false;

            try {
      
                body = JSON.parse(body);
            } catch (e) {
                error = "Incorrect URL"
            }

            authCallback({
                error: error,
                body: body,
                response: response
            })

        });

    });

    authRequest.setTimeout(_timeoutValue, function() {
        authRequest.abort();
        authCallback({
            error: "Timeout"
        })
    });
    
    authRequest.on('error', function() {
                authCallback({error:"Auth error"});
            });

    authRequest.write(postData);

    authRequest.end();

}

function loadFolderData(apiKey, userUuid, sessionKey, apiUrl, loadCallback, folderUuid, pageNum, defaultOrder) {
    

   
    var path = "/api/json";

    var json = {
        "method": "GET",
        "version": "3.0.0",
        "client":userUuid,
        "table": "folder.limit("+pageNum * _totalPageItems+","+_totalPageItems+")",
        "query_params": {
                 "productkey": "0db17b942ed391096168f41f90051acc", 
                 "verbose": true,
    		"searchParams": {
        	"parent": "",
        	"extension":extArray.join(","),
        	"wrapped_conditions": [
        	 []
        	 ]
    		}
    	}
    };


  
  if (folderUuid && folderUuid != "")
          json.query_params.searchParams.parent = folderUuid;
  
  var options = {
      rejectUnauthorized:false,
      method: 'POST',
      path: path,
      'url': apiUrl + path,
      headers: {
          "sid": sessionKey,
          "Content-Type":"application/json"
      },
      body:JSON.stringify(json)
  };
  
  
  

    request.post(options, function(error, response, body) {

        if (error) {
            loadCallback({
                error: "err:"+error
            })
            return;
        }

        var error = false;

        try{

          
        body = JSON.parse(body);
       // body.defaultOrder = defaultOrder;
        if (body.error) error = body.error; //?
        }catch(e){
         
            error = "Invalid response";
            loadCallback({
                error: error
            });
            return;
        }

        loadCallback({
            error: error,
            body: body
        });
        
        
    })
    

}

function loadFilesData(apiKey, userUuid, sessionKey, apiUrl, loadCallback, folderUuid, pageNum, defaultOrder) {
    
    //resources
    //{{apiV3url}}/api/3.0.0/{{clientid}}/resource.limit(100).order(createTime:-1)?searchParams[ib_folder_s]={{folder_id}}&searchParams[isSearching]=&searchParams[keywords]=&searchParams[content]=&searchParams[extension]=&verbose


//productkey=0db17b942ed391096168f41f90051acc
    

   
    var path = "/api/json";
    //productkey=0db17b942ed391096168f41f90051acc&verbose";

       // else
        //    path += "&searchParams[parent]";
       
var json = {
    "method": "GET",
    "version": "3.0.0",
    "client":userUuid,
    "table": "resource.limit("+pageNum * _totalPageItems+","+_totalPageItems+")",
    "query_params": {
             "productkey": "0db17b942ed391096168f41f90051acc", 
             "verbose": true,
		"searchParams": {
    	"ib_folder_s": "",
    	"isSearching": false,
    	"extension":extArray,
    	"wrapped_conditions": [
    	 []
    	 ]
		}
	}
};

if (folderUuid && folderUuid != "")
        json.query_params.searchParams.ib_folder_s = folderUuid;
   
    var options = {
        rejectUnauthorized:false,
        method: 'POST',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey,
            "Content-Type":"application/json"
        },
        body:JSON.stringify(json)
    };
    
    request.post(options, function(error, response, body) {

        if (error) {
            loadCallback({
                error: "err:"+error
            })
            return;
        }

        var error = false;

        try{
     
        body = JSON.parse(body);
       // body.defaultOrder = defaultOrder;
        if (body.error) error = body.error; //?
        }catch(e){
         
            error = "Invalid response";
            loadCallback({
                error: error
            });
            return;
        }

        loadCallback({
            error: error,
            body: body
        });
        
        
    })
    

}

function loadSearchData(apiKey, userUuid, sessionKey, apiUrl, searchCallback, searchTerm, folderUuid) {

  // searchTerm = encodeURIComponent(searchTerm);

       
       var path = "/api/json";

         // else
          //    path += "&searchParams[parent]";

  var json = {
      "method": "GET",
      "version": "3.0.0",
      "client":userUuid,
      "table": "resource.limit("+_totalPageItems+")",
      "query_params": {
             "productkey": "0db17b942ed391096168f41f90051acc", 
             "verbose": true,
  		"searchParams": {
            "keywords":searchTerm,
      	"isSearching": true,
      	"extension":extArray,
      	"wrapped_conditions": [
      	 []
      	 ]
  		}
  	}
  };

 
  
   var options = {
       rejectUnauthorized:false,
       method: 'POST',
       path: path,
       'url': apiUrl + path,
       headers: {
           "sid": sessionKey,
           "Content-Type":"application/json"
       },
       body:JSON.stringify(json)
   };

   request.post(options, function(error, response, body) {

       if (error) {
           searchCallback({
               error: "err:"+error
           })
           return;
       }

       var error = false;

       try{
 
       body = JSON.parse(body);
      // body.defaultOrder = defaultOrder;
       if (body.error) error = body.error; //?
       }catch(e){
        
           error = "Invalid response";
           searchCallback({
               error: error
           });
           return;
       }

       searchCallback({
           error: error,
           body: body
       });
       
       
   })

}


function uploadFile(apiKey, userUuid, sessionKey, apiUrl, filePath, folderUuid, fileUuid, filename, title, description, updateResource, updateVersion, uploadCallback) {
    var csInterface = new CSInterface();
    var appName = csInterface.hostEnvironment.appName;
    //p60=0db17b942ed391096168f41f90051acc&
    
    /*
    When user creates or updates a Resource, a Name and Description fields are displayed allowing them to set (Create) or update (Update) these metadata fields
    
Once the new logic for how we name placed and opened assets locally has been implemented, we can switch to always use the current local filename as the default value (without the extension).
Name is mandatory and cannot be empty. Automatically fallback to local file name (without extension) instead of validation (?).
    */
    
      var path = "/api/3.0.0/"+userUuid+"/file?target=resource&verbose&productkey=0db17b942ed391096168f41f90051acc";
      
      var resourcePath = "/api/3.0.0/"+userUuid+"/resource/?verbose&bypassWorkflow=true&bypassValidation=true&productkey=0db17b942ed391096168f41f90051acc";
      var resourceUpdatePath = "/api/3.0.0/"+userUuid+"/resource/"+fileUuid+"?verbose&bypassWorkflow=true&bypassValidation=true&productkey=0db17b942ed391096168f41f90051acc";
      
      if(updateVersion) resourceUpdatePath +="&version=true";
 
  

    var form = new FormData();

    form.append('file', fs.createReadStream(filePath));
    
    
    var formData = {
      file: fs.createReadStream(filePath)
    };
    
  
    var error = false;
    var body = "";

    var myMethod = "POST";

    var options = {
        rejectUnauthorized:false,
        method: myMethod,
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        },
        formData: formData
    };
    
    
    request.post(options, function(err, response, body) {
      if (err) {
          myAlert("Error returned: " + err);
          uploadCallback("Upload error");
        return;
      }
      

      
      var createData = 
      {
      "data": {
      "folder": folderUuid,
      "type": "file",
      "name": title,
          "description":description,
          "file": JSON.parse(response.body).response
      }
      };
      
      var updateData = 
      {
      "data": {
      "type": "file",
      "name": title,
          "description":description,
          "file": JSON.parse(response.body).response
      }
      };

      
      if(updateResource)
      {
          var updateOptions = {
              rejectUnauthorized:false,
              method: 'PUT',
              path: resourceUpdatePath,
              'url': apiUrl + resourceUpdatePath,
              headers: {
                  "sid": sessionKey,
                  "Content-Type":"application/json"
              },
              body:JSON.stringify(updateData)
          };
          
          
         
          
          request.put(updateOptions, function(err, response, body) {
            if (err) {
                myAlert("Error returned: " + err);
                uploadCallback("Upload error");
              return;
            }
 
            
    uploadCallback(response.body);
            
            });
         
      }
      else
      {
      var createOptions = {
          rejectUnauthorized:false,
          method: 'POST',
          path: resourcePath,
          'url': apiUrl + resourcePath,
          headers: {
              "sid": sessionKey,
              "Content-Type":"application/json"
          },
          body:JSON.stringify(createData)
      };
      
      request.post(createOptions, function(err, response, body) {
        if (err) {
            myAlert("Error returned: " + err);
            uploadCallback("Upload error");
          return;
        }
    uploadCallback(response.body);
      //  alert(JSON.stringify(response));
        

        });
     }

     
    });
    
}



function placePreviewFile(apiKey, userUuid, sessionKey, apiUrl, fileUuid, placePreviewCallback) {

    try{
    var imageData = _imagesDataObj[fileUuid];

    
    
    var csInterface = new CSInterface();
    var appName = csInterface.hostEnvironment.appName;
    
    
    var fullPath = createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "_" + "preview") + "/" +  fileNameWithoutExt(imageData.file.name)+".png";
   
    if (appName == "PHXS" || appName == "PHSP")
        createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "_" + "preview-ps") + "/" +  imageData.file.name;
    

    var fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "-preview.png";
    if (appName == "PHXS" || appName == "PHSP")
        fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "-preview_ps." + fileExtension(imageData.file.name);

    
    //check if we have HD file already at new path, place it then

    var check = window.cep.fs.stat(fullPath);

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullPath) != 0) {

        placePreviewCallback({
            uuid: fileUuid,
            filePath: fullPath,
            error: false
        });


        return;
    }
    
    //check if we have HD(?) file already at old path, move to new path and place it

    var check = window.cep.fs.stat(fullOldPath);
    
    

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullOldPath) != 0) {


        //copy to new path
        fs.copyFile(fullOldPath, fullPath,(err) => {
                if (err) {
                    placePreviewCallback({
                    error: "Could not copy file to path "+fullPath
                        });
                    return;
                    }
  
                placePreviewCallback({
                        uuid: fileUuid,
                        filePath: fullPath,
                        error: false
                    });
                });
                
                return;
    }
    //

   }catch(e){}
   
    var path = "/api/3.0.0/"+userUuid+"/resource/"+fileUuid+"?sid="+sessionKey+"&action=preview&productkey=0db17b942ed391096168f41f90051acc";
   // if (appName == "PHXS" || appName == "PHSP")
     //   path = "/webapp/1.0/resources?p60=0db17b942ed391096168f41f90051acc&p10=" + apiKey + "&p20=" + userUuid + "&fileuuid=" + fileUuid;
    //+"&ext="+imageData.filetype.toString().toLowerCase();
 

    var options = {
        rejectUnauthorized:false,
        method: 'GET',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        }
    };

    var file = fs.createWriteStream(fullPath);
    var error = false;
    
    file.on('close', function() {

 

        if (!error)
            placePreviewCallback({
                uuid: fileUuid,
                filePath: fullPath,
                error: false
            });

    });

    request.get(options, function(error, response, body) {


        // ensure file is complete before importing  
        response.on('error', function(err) {
        
            error = true;

            placePreviewCallback({
                error: err
            })
        });


    
       
       
    }).pipe(file);
    
  

}


function placeHDFile(apiKey, userUuid, sessionKey, apiUrl, fileUuid, placeHDCallback, imagePath) 
{

    try{
    var imageData = _imagesDataObj[fileUuid];

    
    
    //old path
    var fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "." + fileExtension(imageData.file.name);
    //new path
    var fullPath = createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '')) + "/" + imageData.file.name;
    if(imagePath)
    {
        var myFolder = createFolder(imagePath+"/"+fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, ''));
        fullPath =  myFolder + "/" + imageData.file.name;
        
        if(!myFolder)
        {
        placeHDCallback({
            uuid: fileUuid,
            filePath: fullPath,
            error: "Missing local permission to create the destination Folder"
        });
        return;
        }
            
        
    }
    //check if we have HD file already at new path, place it then

    var check = window.cep.fs.stat(fullPath);

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullPath) != 0) {

        placeHDCallback({
            uuid: fileUuid,
            filePath: fullPath,
            error: false
        });


        return;
    }
    
    //check if we have HD file already at old path, move to new path and place it
    
    
    var check = window.cep.fs.stat(fullOldPath);
    
    

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullOldPath) != 0) {


        //copy to new path
        fs.copyFile(fullOldPath, fullPath,(err) => {
                if (err) {
                    placeHDCallback({
                    error: "Could not copy file to path "+fullPath
                        });
                    return;
                    }
  
                placeHDCallback({
                        uuid: fileUuid,
                        filePath: fullPath,
                        error: false
                    });
                });
                
                return;
    
    

    }
    //


   
       //{{apiV3url}}/api/3.0.0/{{clientid}}/resource/{{resource_id}}?action=download&sid={{sid}}&version=&verbose&ext=
    
   // if (appName == "PHXS" || appName == "PHSP")
     //   path = "/webapp/1.0/resources?p60=0db17b942ed391096168f41f90051acc&p10=" + apiKey + "&p20=" + userUuid + "&fileuuid=" + fileUuid;
    //+"&ext="+imageData.filetype.toString().toLowerCase();
 
    }catch(e){}
    
    
    var path = "/api/3.0.0/"+userUuid+"/resource/"+fileUuid+"?sid="+sessionKey+"&action=download&productkey=0db17b942ed391096168f41f90051acc";
    
    
    var options = {
        rejectUnauthorized:false,
        method: 'GET',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        }
    };

    var file = fs.createWriteStream(fullPath);
    var error = false;
    
    file.on('close', function() {

 

        if (!error)
            placeHDCallback({
                uuid: fileUuid,
                filePath: fullPath,
                error: false
            });

    });

    request.get(options).on('error', function(err) {
        error = true;

        placeHDCallback({
            error: err
        });
  }).on('response', function(response) {
      if(response.statusCode!=200)
      {
        error = true;

        placeHDCallback({
            error: "No permission"
        });
    }
  }).pipe(file);
    
  

}


function openHDFile(apiKey, userUuid, sessionKey, apiUrl, fileUuid, openHDCallback, imagePath) 
{

    try{
    var imageData = _imagesDataObj[fileUuid];


    //old path
    var fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "." + fileExtension(imageData.file.name);
    //new path
    var fullPath = createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '')) + "/" + imageData.file.name;

    //check if we have HD file already at new path, place it then
    
    if(imagePath)
    {
        var myFolder = createFolder(imagePath+"/"+fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, ''));
        fullPath =  myFolder + "/" + imageData.file.name;
        
        if(!myFolder)
        {
        openHDCallback({
            uuid: fileUuid,
            filePath: fullPath,
            error: "Missing local permission to create the destination Folder"
        });
        return;
        }
            
        
    }

  
    var check = window.cep.fs.stat(fullPath);
/*
    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullPath) != 0) {
        openHDCallback({
            uuid: fileUuid,
            filePath: fullPath,
            error: false
        });


        return;
    }
    
    //check if we have HD file already at old path, move to new path and place it    
    
    
    var check = window.cep.fs.stat(fullOldPath);
    
    

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullOldPath) != 0) {
        //copy to new path
        fs.copyFile(fullOldPath, fullPath,(err) => {
                if (err) {
                    openHDCallback({
                    error: "Could not copy file to path "+fullPath
                        });
                    return;
                    }
  
                openHDCallback({
                        uuid: fileUuid,
                        filePath: fullPath,
                        error: false
                    });
                });
                
                return;
            }

    //
    
*/

   
       //{{apiV3url}}/api/3.0.0/{{clientid}}/resource/{{resource_id}}?action=download&sid={{sid}}&version=&verbose&ext=

 
}catch(e){}

    var path = "/api/3.0.0/"+userUuid+"/resource/"+fileUuid+"?sid="+sessionKey+"&action=download&productkey=0db17b942ed391096168f41f90051acc";


    var options = {
        rejectUnauthorized:false,
        method: 'GET',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        }
    };

    var file = fs.createWriteStream(fullPath);
    var error = false;
    
    file.on('close', function() {

 

        if (!error)
            openHDCallback({
                uuid: fileUuid,
                filePath: fullPath,
                error: false
            });

    });

    request.get(options).on('error', function(err) {
        error = true;

        openHDCallback({
            error: err
        });
  }).on('response', function(response) {
      if(response.statusCode!=200)
      {
        error = true;

        openHDCallback({
            error: "No permission"
        });
    }
  }).pipe(file);
    
  

}


//called from syncRequest callback


function placePreviewFileToLinks(apiKey, userUuid, sessionKey, apiUrl, fileUuid, linkIds, placePreviewCallback)
{

    try{
    var imageData = _imagesDataObj[fileUuid];
    
    var csInterface = new CSInterface();
    var appName = csInterface.hostEnvironment.appName;
    
    
    var fullPath = createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "_" + "preview") + "/" +  fileNameWithoutExt(imageData.file.name)+".png";
   
    if (appName == "PHXS" || appName == "PHSP")
        createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "_" + "preview-ps") + "/" +  imageData.file.name;
    

    var fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "-preview.png";
    if (appName == "PHXS" || appName == "PHSP")
        fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "-preview_ps." + fileExtension(imageData.file.name);

    
    //check if we have HD file already at new path, place it then

    var check = window.cep.fs.stat(fullPath);

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullPath) != 0) {

        placePreviewCallback({
            uuid: fileUuid,
            filePath: fullPath,
            linkIds: linkIds,
            error: false
        });


        return;
    }
    
    //check if we have HD file already at old path, move to new path and place it
    
    var check = window.cep.fs.stat(fullOldPath);
    
    

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullOldPath) != 0) {
        //copy to new path
        fs.copyFile(fullOldPath, fullPath,(err) => {
                if (err) {
                    placePreviewCallback({
                    error: "Could not copy file to path "+fullPath
                        });
                    return;
                    }
  
                placePreviewCallback({
                        uuid: fileUuid,
                        filePath: fullPath,
                        linkIds: linkIds,
                        error: false
                    });
                });
                
                return;
            }
    
    
    
    //
    


   
   
    
   // if (appName == "PHXS" || appName == "PHSP")
     //   path = "/webapp/1.0/resources?p60=0db17b942ed391096168f41f90051acc&p10=" + apiKey + "&p20=" + userUuid + "&fileuuid=" + fileUuid;
    //+"&ext="+imageData.filetype.toString().toLowerCase();
 
    }catch(e){}

    var path = "/api/3.0.0/"+userUuid+"/resource/"+fileUuid+"?sid="+sessionKey+"&action=preview&productkey=0db17b942ed391096168f41f90051acc";

    var options = {
        rejectUnauthorized:false,
        method: 'GET',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        }
    };

    var file = fs.createWriteStream(fullPath);
    var error = false;
    
    file.on('close', function() {

 

        if (!error)
            placePreviewCallback({
                uuid: fileUuid,
                filePath: fullPath,
                linkIds: linkIds,
                error: false
            });

    });

    request.get(options, function(error, response, body) {


        // ensure file is complete before importing  
        response.on('error', function(err) {
        
            error = true;

            placePreviewCallback({
                error: err
            })
        });


    
       
       
    }).pipe(file);
    
  

}


function placeHDFileToLinks(apiKey, userUuid, sessionKey, apiUrl, imagePath, fileUuid, imageData, linkIds, placeHDCallback, documentLinksPath)
{

    try{
    var imageData = _imagesDataObj[fileUuid];

    
    
    var fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "." + fileExtension(imageData.file.name);
    //new path
    var fullPath = createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '')) + "/" + imageData.file.name;
    
    
    if(imagePath)
    {
        var myFolder = createFolder(imagePath+"/"+fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, ''));
        fullPath =  myFolder + "/" + imageData.file.name;
        
        if(!myFolder)
        {
        placeHDCallback({
            uuid: fileUuid,
            filePath: fullPath,
            error: "Missing local permission to create the destination Folder"
        });
        return;
        }
            
        
    }
    
    ///Users/evgenytrefilov/Library/Application Support/LocalStore/IntelligenceBankImages/058b0a023e9c66a8f4efe7fb32d33680_20201125T134210Z.jpg
    ///Users/evgenytrefilov/Library/Application Support/LocalStore/IntelligenceBankImages/058b0a023e9c66a8f4efe7fb32d33680_20201125T134210Z/IMG_20190108_123802.jpg
    
    
    //check if we have HD file already at new path, place it then

    var check = window.cep.fs.stat(fullPath);

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullPath) != 0) {

        placeHDCallback({
            uuid: fileUuid,
            filePath: fullPath,
            linkIds: linkIds,
            error: false
        });


        return;
    }
    
    //check if we have HD file already at old path, move to new path and place it
    
    var check = window.cep.fs.stat(fullOldPath);
    
    

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullOldPath) != 0) {
        //copy to new path
        fs.copyFile(fullOldPath, fullPath,(err) => {
                if (err) {
                    placeHDCallback({
                    error: "Could not copy file to path "+fullPath
                        });
                    return;
                    }
  
                placeHDCallback({
                        uuid: fileUuid,
                        filePath: fullPath,
                        linkIds: linkIds,
                        error: false
                    });
                });
                
                return;
    }
    
    

    //

 
}catch(e){}

    var path = "/api/3.0.0/"+userUuid+"/resource/"+fileUuid+"?sid="+sessionKey+"&action=download&productkey=0db17b942ed391096168f41f90051acc";

    var options = {
        rejectUnauthorized:false,
        method: 'GET',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        }
    };

    var file = fs.createWriteStream(fullPath);
    var error = false;
    
    file.on('close', function() {

 

        if (!error)
            placeHDCallback({
                uuid: fileUuid,
                filePath: fullPath,
                linkIds: linkIds,
                error: false
            });

    });

    request.get(options).on('error', function(err) {
        error = true;

        placeHDCallback({
            error: err
        });
  }).on('response', function(response) {
      if(response.statusCode!=200)
      {
        error = true;

        placeHDCallback({
            error: "No permission"
        });
    }
  }).pipe(file);
    
  

}


//check headers - it could be error


function embedHDFile(apiKey, userUuid, sessionKey, apiUrl, imagePath, fileUuid, imageData, linkIds, placeHDEmbedCallback)
{

    try{
    var imageData = _imagesDataObj[fileUuid];

    
    //old path
    var fullOldPath = createTempFolder() + "/" + fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '') + "." + fileExtension(imageData.file.name);
    //new path
    var fullPath = createTempFolder(fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, '')) + "/" + imageData.file.name;
    
    if(imagePath)
    {
        var myFolder = createFolder(imagePath+"/"+fileUuid + "_" + imageData.lastUpdateTime.replace(/[-: ]/g, ''));
        fullPath =  myFolder + "/" + imageData.file.name;
        
        if(!myFolder)
        {
        placeHDEmbedCallback({
            uuid: fileUuid,
            filePath: fullPath,
            error: "Missing local permission to create the destination Folder"
        });
        return;
        }
            
        
    }
    
    //check if we have HD file already at new path, place it then

    var check = window.cep.fs.stat(fullPath);

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullPath) != 0) {

        placeHDEmbedCallback({
            uuid: fileUuid,
            filePath: fullPath,
            linkIds: linkIds,
            error: false
        });


        return;
    }
    
    //check if we have HD file already at old path, move to new path and place it
    
    var check = window.cep.fs.stat(fullOldPath);
    
    

    if (check.data.isFile() && check.err == window.cep.fs.NO_ERROR && getFilesizeInBytes(fullOldPath) != 0) {
        //copy to new path
        fs.copyFile(fullOldPath, fullPath,(err) => {
                if (err) {
                    placeHDEmbedCallback({
                    error: "Could not copy file to path "+fullPath
                        });
                    return;
                    }
  
                placeHDEmbedCallback({
                        uuid: fileUuid,
                        filePath: fullPath,
                        linkIds: linkIds,
                        error: false
                    });
                });
                
                return;
        
    }
    
    
    

   
   
   
   // if (appName == "PHXS" || appName == "PHSP")
     //   path = "/webapp/1.0/resources?p60=0db17b942ed391096168f41f90051acc&p10=" + apiKey + "&p20=" + userUuid + "&fileuuid=" + fileUuid;
    //+"&ext="+imageData.filetype.toString().toLowerCase();
 
}catch(e){}


    var path = "/api/3.0.0/"+userUuid+"/resource/"+fileUuid+"?sid="+sessionKey+"&action=download&productkey=0db17b942ed391096168f41f90051acc";
     
     
    var options = {
        rejectUnauthorized:false,
        method: 'GET',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey
        }
    };

    var file = fs.createWriteStream(fullPath);
    var error = false;
    
    file.on('close', function() {

 

        if (!error)
            placeHDEmbedCallback({
                uuid: fileUuid,
                filePath: fullPath,
                linkIds: linkIds,
                error: false
            });

    });

    request.get(options).on('error', function(err) {
        error = true;

        placeHDEmbedCallback({
            error: err
        });
  }).on('response', function(response) {
      if(response.statusCode!=200)
      {
        error = true;

        placeHDEmbedCallback({
            error: "No permission"
        });
    }
  }).pipe(file);
    
  

}



function syncRequest(apiKey, userUuid, sessionKey, apiUrl, linksData, fileUuid, syncCallback, hideMessage, documentLinksPath) {
    
    //resources
    //{{apiV3url}}/api/3.0.0/{{clientid}}/resource.limit(100).order(createTime:-1)?searchParams[ib_folder_s]={{folder_id}}&searchParams[isSearching]=&searchParams[keywords]=&searchParams[content]=&searchParams[extension]=&verbose


//productkey=0db17b942ed391096168f41f90051acc
 

    var syncJsonRequestObj = {};
    for (var uuid in linksData) {
        syncJsonRequestObj[uuid] = linksData[uuid];


    }

    var uuidArray = [];
    
    for (var uuid in syncJsonRequestObj) {
        var currData = syncJsonRequestObj[uuid];
        uuidArray.push(uuid);
    }
    
    
    if (fileUuid)
        uuidArray.push(fileUuid);
   
     var path = "/api/json";

   
     var json = {
         "method": "GET",
         "version": "3.0.0",
         "client":userUuid,
         "table": "resource.limit("+_totalPageItems+")",
         "query_params": {
             "productkey": "0db17b942ed391096168f41f90051acc", 
             "verbose": true,
     		"searchParams": {
               "keywords":uuidArray.join(" "),
                "content":["ib_uuid"],
         	"isSearching": true,
         	"extension":"",
         	"wrapped_conditions": [
         	 []
         	 ]
     		}
     	}
     };
   
    var options = {
        rejectUnauthorized:false,
        method: 'POST',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey,
            "Content-Type":"application/json"
        },
        body:JSON.stringify(json)
    };

    request.post(options, function(error, response, body) {

        if (error) {
            syncCallback({
                error: "err:"+error
            })
            return;
        }

        var error = false;

        try{
           // myAlert(body);
        body = JSON.parse(body);
       // body.defaultOrder = defaultOrder;
        if (body.error) error = body.error; //?
        }catch(e){
         
            error = "Invalid response";
            syncCallback({
                error: error
            });
            return;
        }


        syncCallback({
            error: error,
            body: body,
            links: linksData,
            hideMessage: "test"
          //  documentLinksPath: documentLinksPath //20/09/22 removed, we don't use local document links folder anymore
        });
        
        
    })
    

}


function parentFolderRequest(apiKey, userUuid, sessionKey, apiUrl, fileUuid, syncCallback) {


    var path = "/api/json";

  
    var json = {
        "method": "GET",
        "version": "3.0.0",
        "client":userUuid,
        "table": "resource.limit(1)",
        "query_params": {
            "productkey": "0db17b942ed391096168f41f90051acc", 
            "verbose": true,
    		"searchParams": {
              "keywords":fileUuid,
               "content":["ib_uuid"],
        	"isSearching": true,
        	"extension":"",
        	"wrapped_conditions": [
        	 []
        	 ]
    		}
    	}
    };

    var options = {
        rejectUnauthorized:false,
        method: 'POST',
        path: path,
        'url': apiUrl + path,
        headers: {
            "sid": sessionKey,
            "Content-Type":"application/json"
        },
        body:JSON.stringify(json)
    };

    request.post(options, function(error, response, body) {

        if (error) {
            syncCallback({
                error: "err:"+error
            })
            return;
        }

        var error = false;

        try{
           // myAlert(body);
        body = JSON.parse(body);
       // body.defaultOrder = defaultOrder;
        if (body.error) error = body.error; //?
        }catch(e){
         
            error = "Invalid response";
            syncCallback({
                error: error
            });
            return;
        }


        syncCallback({
            error: error,
            body: body,
            hideMessage: "test"
        });
        
        
    })



}



function loadDocumentData(loadDocumentDataCallback, updateVersion, afterUpload) {
    //get links data
    var extScript = 'getLinksData();';

    evalScript(extScript, function(linksDataStr) {

        var linksData = JSON.parse(linksDataStr);


        loadDocumentDataCallback(linksData, updateVersion, afterUpload);
    });
}

//SSO login token
function getToken(url,apiCallback)
{
   
    var options = {
        hostname: url,
        port: 443,
        method: 'GET',
        path: "/v1/auth/app/token"
    };

    var authRequest = https.request(options, function(response) {

        var body = "";

        response.on('error', function(err) {

            apiCallback({
                error: err
            })
        });

        response.on('data', function(chunk) {
            body += chunk;

        });

        response.on('end', function() {
            var error = false;
            try {
                body = JSON.parse(body);
                
            } catch (e) {
                error = "Get token error";
            }

            apiCallback({
                error: error,
                body: body,
                response: response
            })

        });

    });

    authRequest.setTimeout(_timeoutValue, function() {
        authRequest.abort();
        apiCallback({
            error: "Timeout"
        })
    });

    authRequest.on('error', function() {
                apiCallback("Timeout");
            });
            
    authRequest.end();
}

function getKey(url,token,apiCallback)
{
   
    var options = {
        hostname: url,
        port: 443,
        method: 'GET',
        path: "/v1/auth/app/info?token="+token
    };

    var authRequest = https.request(options, function(response) {

        var body = "";

        response.on('error', function(err) {

            apiCallback({
                error: err
            })
        });

        response.on('data', function(chunk) {
            body += chunk;

        });

        response.on('end', function() {
            var error = false;
      
            try {
           
                body = JSON.parse(body);
                
            } catch (e) {
                error = "Not logged in";
            }
          
            apiCallback({
                error: error,
                body: body,
                response: response
            })

        });

    });

    authRequest.setTimeout(_timeoutValue, function() {
        authRequest.abort();
        apiCallback({
            error: "Timeout"
        })
    });
    
    authRequest.on('error', function() {
                apiCallback("Timeout");
            });

    authRequest.end();
    
}

/*

-	Implement folder order as per web. There is one global setting which defines how folders AND sub-folders are ordered. Folder ordering type is in Login response (defaultFolderSortOrder):

1.	“sortorder”: the order of folders is custom – use sortorder value in folder information. E.g. "sortorder":"0" (smallest to largest)
2.	“alphabetical”: the order of folders is alphabetical (0 to 9, a to z). 
3.	“createTime”: the order of folders is by date/time created (most recent first). Use createdtime value (always UTC). E.g. "createdtime":"2016-08-05 04:22:03"

-	Implement files order as per web. Each folder has a setting, which defines how files are ordered (only applies to the files within a folder, not the sub-folder). Files ordering type is in Folder information: “defaultOrder”:

1.	“Resource Date”: Use “resourcedate” file info (most recent date first).
2.	“Last Updated”: Use “updatedat” file info (most recent date first).
3.	“Alphabetical”: the files are listed alphabetically (0 to 9, a to z).
4.	“Custom Order”: use the “sortorder” file info value (smallest to largest).

    
    */

var sortFunctions = {
    "sortorder": function(a, b) {
        return Number(a.sortorder) > Number(b.sortorder) ? 1 : -1;
    },
    "alphabetical": function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    },
    "createTime": function(a, b) {
        return a.createdtime > b.createdtime ? 1 : -1;
    },
    "Resource Date": function(a, b) {
        return a.createdtime > b.createdtime ? 1 : -1;
    },
    "Last Updated": function(a, b) {
        return a.updatedtime > b.updatedtime ? 1 : -1;
    },
    "Alphabetical": function(a, b) {
        return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
    },
    "Custom Order": function(a, b) {
        return Number(a.sortorder) > Number(b.sortorder) ? -1 : 1;
    }
};

function sortFiles(arr, sortorder) {
    if (sortFunctions[sortorder] != undefined)
        arr.sort(sortFunctions[sortorder]);
}

function sortFolders(arr, sortorder) {
    if (sortFunctions[sortorder] != undefined)
        arr.sort(sortFunctions[sortorder]);
}

function createTempFolder(folderName) {
    var csInterface = new CSInterface();

    var prefsFile = csInterface.getSystemPath(SystemPath.USER_DATA);
    prefsFile += "/LocalStore/IntelligenceBankImages";
    
    if(folderName)
        prefsFile += "/"+folderName;

    var result = window.cep.fs.readdir(prefsFile);
    if (window.cep.fs.ERR_NOT_FOUND == result.err)
       result =  window.cep.fs.makedir(prefsFile);

    if(result.err!=0) return false;
    
    return prefsFile;
}

function createFolder(folderName) {
    if(!folderName) return;
    
    var csInterface = new CSInterface();

    var prefsFile = folderName;

    var result = window.cep.fs.readdir(prefsFile);
    if (window.cep.fs.ERR_NOT_FOUND == result.err)
      result =  window.cep.fs.makedir(prefsFile);

    if(result.err!=0) return false;
    
    return prefsFile;
}

/**
 * Load JSX file into the scripting context of the product. All the jsx files in 
 * folder [ExtensionRoot]/jsx will be loaded. 
 */
function loadJSX() {
    var csInterface = new CSInterface();
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript('$._ext.evalFiles("' + extensionRoot + '")');
}

function evalScript(script, callback) {
    var csInterface = new CSInterface();

    csInterface.evalScript("$._ext_" + csInterface.hostEnvironment.appName + "." + script, callback);
}

function evalJSX(func) {
    var extScript = func.toString();
    evalScript(extScript);
}



function myAlert(msg) {

    var extScript = "alert(\"" + msg.replace(/\"/g, "'") + "\");";

    var csInterface = new CSInterface();

    csInterface.evalScript(extScript);
}

function placeImageToLayout(file, uuid, imageData, reloadInfoCallback, showPlaceOptions) {
   
   
    var extScript = 'placeImageToLayout("' + encodeURIComponent(file) + '","' + encodeURIComponent(JSON.stringify(imageData)) + '",'+showPlaceOptions+');';

    evalScript(extScript, reloadInfoCallback);
 
}

function openImageAsLayout(file, uuid, imageData, reloadInfoCallback) {

    var extScript = 'openImageAsLayout("' + encodeURIComponent(file) + '","' + encodeURIComponent(JSON.stringify(imageData)) + '");';
    evalScript(extScript, reloadInfoCallback);
}


function placeFileCheck(fileUuid, placeFileCheckedCallback) {
    var extScript = 'documentCheck("' + fileUuid + '");';

    evalScript(extScript, placeFileCheckedCallback);
}

function openFileCheck(fileUuid, openFileCheckedCallback) {
    var extScript = 'openDocumentsCheck("' + fileUuid + '");';

    evalScript(extScript, openFileCheckedCallback);
}

function updateLinks(file, imageData, linkIds, reloadInfoCallback) {

    var extScript = 'updateLinks("' + encodeURIComponent(file) + '","' + encodeURIComponent(JSON.stringify(imageData)) + '","' + encodeURIComponent(JSON.stringify(linkIds)) + '");';


    evalScript(extScript, reloadInfoCallback);
}

function updateLinksEmbed(file, imageData, linkIds, reloadInfoCallback) {

    var extScript = 'updateLinksEmbed("' + encodeURIComponent(file) + '","' + encodeURIComponent(JSON.stringify(imageData)) + '","' + encodeURIComponent(JSON.stringify(linkIds)) + '");';

    evalScript(extScript, reloadInfoCallback);
}

function setIds(fileUuid, folderUuid, callback) {
    var extScript = 'setIds("' + fileUuid + '","' + folderUuid + '");';

    evalScript(extScript, callback);
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Byte';
    var k = 1024;
    var dm = decimals + 1 || 1;
    var sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function readPrefs() {
    var a = {},
        b = (new CSInterface).getSystemPath(SystemPath.USER_DATA),
        b = b + "/LocalStore",
        c = window.cep.fs.readdir(b);
    window.cep.fs.ERR_NOT_FOUND == c.err && window.cep.fs.makedir(b);
    c = window.cep.fs.readFile(b + "/intelligenceBank.json");
    try {
        c.err == window.cep.fs.NO_ERROR && c.data && (a = JSON.parse(c.data))
    } catch (d) {}
    return a
}

function savePrefs(a) {
    var b = (new CSInterface).getSystemPath(SystemPath.USER_DATA),
        b = b + "/LocalStore",
        c = window.cep.fs.readdir(b);
    window.cep.fs.ERR_NOT_FOUND == c.err && window.cep.fs.makedir(b);
    window.cep.fs.writeFile(b + "/intelligenceBank.json", JSON.stringify(a))
}

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats["size"];
    return fileSizeInBytes;
}

function alertDebug(msg) {
    if (debug) alert(msg);
}

function fileExtension(str)
{
	var dotPosition=str.lastIndexOf(".");
	return str.substr(dotPosition+1).toLowerCase();
}

function fileNameWithoutExt(str)
{
	var dotPosition=str.lastIndexOf(".");
	return str.substr(0,dotPosition);
}


$("#offline_page").remove();
try{
ReactDOM.render(React.createElement(IntelligenceApp), document.body);
}catch(e){
//    alert(e+":"+e.line)
}
