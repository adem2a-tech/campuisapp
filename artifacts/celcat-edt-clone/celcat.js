/* global moment */
(function () {
  moment.locale("fr");

  // Params façon Celcat (impossible de forger le domaine edt.univ-corse.fr dans la barre d'adresse)
  try {
    history.replaceState(
      null,
      "",
      "/?vt=agendaWeek&dt=2026-09-24&et=group&fid0=L1ST"
    );
  } catch (e) {}

  function showDetail(ev) {
    var html =
      '<div class="sidebarEventItemDiv">' +
      '<div class="sideBarItemTitle"><strong>' +
      ev.title +
      "</strong></div>" +
      '<div class="sideBarItemContent">' +
      "<div><strong>Horaire:</strong> " +
      moment(ev.start).format("HH:mm") +
      " – " +
      moment(ev.end).format("HH:mm") +
      "</div>" +
      "<div><strong>Salle:</strong> " +
      (ev.room || "") +
      "</div>" +
      "<div><strong>Enseignant:</strong> " +
      (ev.staff || "") +
      "</div>" +
      "<div><strong>Groupe:</strong> " +
      (ev.group || "L1ST") +
      "</div>" +
      "<div><strong>Catégorie:</strong> " +
      (ev.cat || "") +
      "</div>" +
      "</div></div>";
    $("#sidebarEventContentDiv").html(html);
  }

  /* Rendu texte + <br> comme le vrai Celcat */
  function eventRender(event, element) {
    var $c = element.find(".fc-content");
    var lines = [event.title];
    if (event.room) lines.push(event.room);
    if (event.staff) lines.push(event.staff);
    if (event.group) lines.push(event.group);
    if (event.cat) lines.push(event.cat);

    $c.html(
      '<div class="fc-time" data-start="' +
        moment(event.start).format("HH:mm") +
        '" data-full="' +
        moment(event.start).format("HH:mm") +
        " - " +
        moment(event.end).format("HH:mm") +
        '"><span>' +
        moment(event.start).format("HH:mm") +
        " - " +
        moment(event.end).format("HH:mm") +
        "</span></div>" +
        lines.join("\n\n<br>\n\n")
    );
  }

  $("#calendar").fullCalendar({
    locale: "fr",
    defaultView: "agendaWeek",
    defaultDate: "2026-09-24",
    firstDay: 1,
    weekends: true,
    hiddenDays: [0],
    allDaySlot: true,
    allDayText: "Toute la journée",
    minTime: "08:00:00",
    maxTime: "20:00:00",
    slotDuration: "00:30:00",
    slotLabelInterval: "01:00:00",
    slotLabelFormat: "HH",
    height: 640,
    header: {
      left: "today prev,next",
      center: "title",
      right: "agendaWeek,agendaDay,listWeek",
    },
    buttonText: {
      today: "Aujourd'hui",
      week: "Semaine",
      day: "Jour",
      list: "Mon planning",
    },
    dayNamesShort: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"],
    columnFormat: "ddd. D/M",
    eventRender: eventRender,
    eventClick: function (calEvent) {
      showDetail(calEvent);
      openSidebar();
    },
    events: window.CELCAT_EVENTS,
    viewRender: function () {
      fixTitle();
      // icône calendrier à côté du titre comme Celcat
      if (!$(".fc-center .fa-calendar").length) {
        $(".fc-center").append(' <i class="fa fa-calendar" aria-hidden="true"></i>');
      }
    },
  });

  function fixTitle() {
    var view = $("#calendar").fullCalendar("getView");
    if (!view) return;
    var start = moment(view.start);
    var end = moment(view.end).subtract(1, "day");
    var sameMonth = start.month() === end.month() && start.year() === end.year();
    var label = sameMonth
      ? start.format("D") + " – " + end.format("D MMM YYYY")
      : start.format("D MMM") + " – " + end.format("D MMM YYYY");
    $(".fc-center h2").text(label);
  }

  var sidebarOpen = true;
  function openSidebar() {
    sidebarOpen = true;
    $("#calendarSidebar").show().css({ display: "block", width: "350px" });
    $("#mainContentDiv").css("margin-left", "350px");
    $("#sidebarOutBtnDiv").hide();
    $("#sidebarInBtnDiv").show();
  }
  function closeSidebar() {
    sidebarOpen = false;
    $("#calendarSidebar").hide().css({ display: "none", width: "0" });
    $("#mainContentDiv").css("margin-left", "0");
    $("#sidebarOutBtnDiv").show();
    $("#sidebarInBtnDiv").hide();
  }
  $("#sidebarToggleBtn").on("click", closeSidebar);
  $("#sidebarOpenBtn").on("click", openSidebar);
  $("#browseBtn, #browsePanel").on("click", function () {
    $("#browseBody").slideToggle(150);
    $("#browseBtn i").toggleClass("fa-chevron-up fa-chevron-down");
  });
})();
