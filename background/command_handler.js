var CommandHandler = function(Messaging, CapturedCredentialStorage, Realms, Linker, AccountManager) {
  function addLogin(message, sender) {
    var currentUser = Gombot.getCurrentUser(),
        tabID = sender.tab.id;

    Linker.shouldShowLinkingNotification(currentUser, message, { success: function(linkingInfo) {
      // first delete the captured credentials
      CapturedCredentialStorage.deleteCredentials(sender.tab);
      if (!linkingInfo) return;
      _.extend(message, linkingInfo);
      if (currentUser) {
        // Prompt the user to save the login
        displayInfobar({
          notify: true,
          tabID: tabID,
          notification: message
        });
      } else {
        displayInfobar({
          notify: true,
          tabID: tabID,
          notification: {
            type: 'signup_nag'
          }
        });
      }
    }});
  }

  function validatePin(message, sender, callback) {
    callback({
        'is_valid': validatePIN(message.pin) // TODO: need to port this over
    });
  }

  function setCapturedCredentials(message, sender, callback) {
    CapturedCredentialStorage.setCredentials(message, sender.tab);
  }

  function getCapturedCredentials(message, sender, callback) {
    CapturedCredentialStorage.getCredentials(message, sender.tab, callback);
  }

  function deleteCapturedCredentials(message, sender, callback) {
    CapturedCredentialStorage.deleteCredentials(sender.tab);
  }

  // TODO: Have this execute callbacks: one what we have now and one after the fetch
  // The callback can only be executed once, so we should set up a channel or use another mechanism
  function getSavedCredentials(message, sender, callback) {
    var currentUser = Gombot.getCurrentUser(),
        logins = [];
    if (!currentUser) return false;
    currentUser.fetch({ success: function() {
      logins = currentUser.get('logins').filter(function(loginCredential) {
        return Realms.isUriMemberOfRealm(sender.tab.url, loginCredential.origins);
      });
    callback(logins);
    }});
    // Chrome requires that we return true if we plan to call a callback
    // after an onMessage function returns.
    return true;
  }

  function showPINPromptInfobar(message, sender, callback) {
      displayInfobar({
        notify: true,
        tabID: sender.tab,
        notification: {
          type: 'pin_entry',
          // Include the tabID in the notification so the infobar handler
          // can trigger autofill in the correct tab.
          tabID: sender.tab.id,
          callback: callback
        }
      });
      return true;
  }

  // probably will need to tweak this
  function getSiteConfig(message, sender, callback) {
    callback(Gombot.SiteConfigs[Gombot.TldService.getDomain(sender.tab.url)] || {});
  }

  // create a new user account
  function createUser (message, sender, callback) {
    AccountManager.createAccount(message, callback);
    return true;
  }

  // sign into a user account
  function signIn (message, sender, callback) {
    AccountManager.signIn(message, callback);
    return true;
  }

  var commandHandlers = {
    'add_login': addLogin,
    'validate_pin': validatePin,
    'prompt_for_pin': showPINPromptInfobar,
    'set_captured_credentials': setCapturedCredentials,
    'get_captured_credentials': getCapturedCredentials,
    'delete_captured_credentials': deleteCapturedCredentials,
    'get_saved_credentials': getSavedCredentials,
    'get_site_config': getSiteConfig,
    'create_user': createUser,
    'sign_in': signIn
  };

  //
  // Content-to-chrome message handlers
  //
  Messaging.addContentMessageListener(function(request, sender, sendResponse) {
    if (request.type && commandHandlers[request.type]) {
      //console.log("Msg received", request, sender);
      return commandHandlers[request.type].call(commandHandlers,request.message,sender,sendResponse);
    }
  });
};
