
/*
    Markdown editor attachment upload, should be loaded before $.editor()
    requires: util.js
 */

(function() {
  var $, EditorAttachmentUpload,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  $ = jQuery;

  EditorAttachmentUpload = (function() {
    EditorAttachmentUpload.prototype.defaults = {
      csrfToken: "csrf_token",
      target: "target url",
      placeholderText: "uploading {attachment_name}"
    };

    function EditorAttachmentUpload(el, options) {
      this.openFileDialog = bind(this.openFileDialog, this);
      this.textReplace = bind(this.textReplace, this);
      this.addStatusError = bind(this.addStatusError, this);
      this.addError = bind(this.addError, this);
      this.addAttachment = bind(this.addAttachment, this);
      this.buildFormData = bind(this.buildFormData, this);
      this.addPlaceholder = bind(this.addPlaceholder, this);
      this.sendFile = bind(this.sendFile, this);
      this.el = $(el);
      this.options = $.extend({}, this.defaults, options);
      this.inputFile = $("<input/>", {
        type: "file"
      });
      this.setUp();
    }

    EditorAttachmentUpload.prototype.setUp = function() {
      var $boxAttachment;
      if (window.FormData == null) {
        return;
      }
      this.inputFile.on('change', this.sendFile);
      $boxAttachment = $(".js-box-attachment");
      $boxAttachment.on('click', this.openFileDialog);
      return $boxAttachment.on('click', this.stopClick);
    };

    EditorAttachmentUpload.prototype.sendFile = function() {
      var file, formData, placeholder, post;
      file = this.inputFile.get(0).files[0];
      placeholder = this.addPlaceholder(file);
      formData = this.buildFormData(file);
      post = $.ajax({
        url: this.options.target,
        data: formData,
        processData: false,
        contentType: false,
        type: 'POST'
      });
      post.done((function(_this) {
        return function(data) {
          if ("url" in data) {
            return _this.addAttachment(data, file, placeholder);
          } else {
            return _this.addError(data, placeholder);
          }
        };
      })(this));
      post.fail((function(_this) {
        return function(jqxhr, textStatus, error) {
          return _this.addStatusError(textStatus, error, placeholder);
        };
      })(this));
    };

    EditorAttachmentUpload.prototype.addPlaceholder = function(file) {
      var placeholder;
      placeholder = $.format("[" + this.options.placeholderText + "]()", {
        attachment_name: file.name
      });
      this.el.val(this.el.val() + placeholder);
      return placeholder;
    };

    EditorAttachmentUpload.prototype.buildFormData = function(file) {
      var formData;
      formData = new FormData();
      formData.append('csrfmiddlewaretoken', this.options.csrfToken);
      formData.append('attachment', file);
      return formData;
    };

    EditorAttachmentUpload.prototype.addAttachment = function(data, file, placeholder) {
      var attachmentTag;
      attachmentTag = $.format("[{name}]({url})", {
        name: file.name,
        url: data.url
      });
      return this.textReplace(placeholder, attachmentTag);
    };

    EditorAttachmentUpload.prototype.addError = function(data, placeholder) {
      var error;
      error = JSON.stringify(data);
      return this.textReplace(placeholder, "![" + error + "]()");
    };

    EditorAttachmentUpload.prototype.addStatusError = function(textStatus, error, placeholder) {
      var errorTag;
      errorTag = $.format("![error: {code} {error}]()", {
        code: textStatus,
        error: error
      });
      return this.textReplace(placeholder, errorTag);
    };

    EditorAttachmentUpload.prototype.textReplace = function(find, replace) {
      this.el.val(this.el.val().replace(find, replace));
    };

    EditorAttachmentUpload.prototype.openFileDialog = function() {
      this.inputFile.trigger('click');
    };

    EditorAttachmentUpload.prototype.stopClick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    return EditorAttachmentUpload;

  })();

  $.fn.extend({
    editor_attachment_upload: function(options) {
      return this.each(function() {
        if (!$(this).data('plugin_editor_attachment_upload')) {
          return $(this).data('plugin_editor_attachment_upload', new EditorAttachmentUpload(this, options));
        }
      });
    }
  });

  $.fn.editor_attachment_upload.EditorAttachmentUpload = EditorAttachmentUpload;

}).call(this);
