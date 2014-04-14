/**
* A module to preview a link's comments without opening the links comment page.
* @Author Brett Konold
*/

modules['showComments'] = {
	moduleID: 'showComments',
	moduleName: 'Comment Thread Preview',
	category: 'Comments',
	options: {
		hoverDelay: {
			type: 'text',
			value: 500,
			description: 'Delay, in milliseconds, before parent hover loads. Default is 500.'
		},
		fadeDelay: {
			type: 'text',
			value: 200,
			description: 'Delay, in milliseconds, before parent hover fades away after the mouse leaves. Default is 200.'
		},
        fadeSpeed: {
            type: 'text',
            value: 0.3,
            description: 'Fade animation\'s speed. Default is 0.3, the range is 0-1. Setting the speed to 1 will disable the animation.'
        },
		numCommentsToDisplay: {
			type: 'text',
			value: 5,
			description: 'Number of top level comments to display in hover preview.'
		},
	},
	description: 'Shows an interactive preview of a link\'s comment thread, when hovering over the \'XXXX comments\' button below a link ',
	isEnabled: function() {
		return RESConsole.getModulePrefs(this.moduleID);
	},
	include: [
		'comments'
	],
	isMatchURL: function() {
		var windowURL = window.location.toString();
        var matches = windowURL.match(/^http:\/\/www\.reddit\.com(\/r\/[A-Za-z]+)?\/?#?$/i);
        return matches == null ? false : matches.length > 0;
	},
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
            console.log("Module Initialized");
			$('body').on('mouseenter', '.comments', function(e) {
				modules['hover'].begin(this, {
					openDelay: modules['showComments'].options.hoverDelay.value,
					fadeDelay: modules['showComments'].options.fadeDelay.value,
					fadeSpeed: modules['showComments'].options.fadeSpeed.value
				}, modules['showComments'].showCommentHover, {});
			});
		}
	},
	handleVoteClick: function(evt) {
		var $this = $(this),
			voteClasses = {
				'-1': 'dislikes',
				0: 'unvoted',
				1: 'likes'
			},
			id = $this.parent().parent().data('fullname'),
			direction = /(up|down)(?:mod)?/.exec(this.className);

		if (!direction) return;

		direction = direction[1];

		var $targetButton = $('.content .thing.id-' + id).children('.midcol')
			.find('.arrow.' + direction + ', .arrow.' + direction + 'mod');

		if ($targetButton.length !== 1) {
			console.error("When attempting to find %s arrow for comment %s %d elements were returned",
				direction, id, $targetButton.length);
			return;
		}

		// Prevent other click handlers from running
		// Note that $targetButton's other click handlers run before this one,
		// by a "first come, first serve" basis
		var removeClickHandlers = function(event) {
			event.stopPropagation();
		};

		$targetButton.on('click', removeClickHandlers);
		$targetButton.click();
		$targetButton.off('click', removeClickHandlers);

		var clickedDir = (direction === 'up' ? 1 : -1),
			$midcol = $this.parent(),
			startDir;

		$.each(voteClasses, function(key, value) {
			if ($midcol.hasClass(value)) {
				startDir = parseInt(key, 10);
				return;
			}
		});

		var newDir = clickedDir === startDir ? 0 : clickedDir;

		$midcol.parent().children('.' + voteClasses[startDir])
			.removeClass(voteClasses[startDir])
			.addClass(voteClasses[newDir]);
		$midcol.find('.up, .upmod')
			.toggleClass('upmod', newDir === 1)
			.toggleClass('up', newDir !== 1);
		$midcol.find('.down, .downmod')
			.toggleClass('downmod', newDir === -1)
			.toggleClass('down', newDir !== -1);
	},

	showCommentHover: function(def, base, context) {
        //console.log("Attempting to hover");

        var threadURL = this.element.pathname;
        //console.log("Target Comment Thread URL: " + threadURL);
        
        //console.log("fetching page");
        var commentThreadPage = $($.ajax(threadURL, {async: false}).responseText);
        //console.log("page fetched");
        //console.log(commentThreadPage);

        var numCommentsToDisplay = modules['showComments'].options.numCommentsToDisplay.value;
        topComments = $("div.commentarea > div.sitetable.nestedlisting > div.thing.comment", commentThreadPage).slice(0, numCommentsToDisplay);
        //console.log(topComments);

        $.each(topComments, function(i, comment) {
            $comment = $(comment);
            $comment.find(".child").remove();
        });
        // TODO: add "view more comments" links to each parent comment, as well as to the end of the container (to see more parents)
        var $container = $('<div class="parentCommentWrapper">');
        $container.append(topComments);
		def.resolve("Comments", $container);
	}
};
