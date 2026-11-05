/*
 * Your invitation, in one place.
 * Replace bracketed copy with your details. An empty image src keeps an explicit
 * photo placeholder. Never put service secrets or private credentials here.
 */
window.WEDDING_CONFIG = {
  couple: {
    partnerOne: "[PARTNER ONE NAME]",
    partnerTwo: "[PARTNER TWO NAME]"
  },
  wedding: {
    date: "[WEDDING DATE]",
    city: "[CITY OR REGION]",
    invitationLine: "[INVITATION LINE]"
  },
  welcome: {
    message: "Together with their families, [PARTNER ONE NAME] and [PARTNER TWO NAME] invite you to celebrate their wedding. A day made even more meaningful by sharing it with you."
  },
  story: {
    text: "[COUPLE STORY]"
  },
  photos: {
    cover: {
      src: "",
      label: "[COVER PHOTO]",
      alt: "[COVER PHOTO ALT TEXT]",
      caption: "[COVER PHOTO CAPTION]"
    },
    feature: {
      src: "",
      label: "[FEATURE PHOTO]",
      alt: "[FEATURE PHOTO ALT TEXT]",
      caption: "[FEATURE PHOTO CAPTION]"
    },
    gallery: [
      { src: "", label: "[GALLERY PHOTO 1]", alt: "[GALLERY PHOTO 1 ALT TEXT]", caption: "[PHOTO CAPTION 1]" },
      { src: "", label: "[GALLERY PHOTO 2]", alt: "[GALLERY PHOTO 2 ALT TEXT]", caption: "[PHOTO CAPTION 2]" },
      { src: "", label: "[GALLERY PHOTO 3]", alt: "[GALLERY PHOTO 3 ALT TEXT]", caption: "[PHOTO CAPTION 3]" }
    ]
  },
  events: [
    {
      id: "ceremony",
      label: "Ceremony",
      name: "[EVENT NAME]",
      date: "[EVENT DATE]",
      startTime: "[START TIME]",
      endTime: "[END TIME]",
      timeZone: "[TIME ZONE]",
      venue: "[VENUE NAME]",
      address: "[FULL STREET ADDRESS]",
      dressCode: "[DRESS CODE]",
      notes: "[EVENT NOTES]",
      directionsUrl: "",
      // ISO dates must include an explicit UTC offset or Z, including seconds.
      // Format: YYYY-MM-DDTHH:MM:SS+HH:MM. Keep blank until the date is confirmed.
      calendar: { start: "", end: "" }
    },
    {
      id: "reception",
      label: "Reception",
      name: "[EVENT NAME]",
      date: "[EVENT DATE]",
      startTime: "[START TIME]",
      endTime: "[END TIME]",
      timeZone: "[TIME ZONE]",
      venue: "[VENUE NAME]",
      address: "[FULL STREET ADDRESS]",
      dressCode: "[DRESS CODE]",
      notes: "[EVENT NOTES]",
      directionsUrl: "",
      calendar: { start: "", end: "" }
    }
  ],
  surprise: { message: "[SURPRISE MESSAGE]" },
  rsvp: {
    deadline: "[RSVP DEADLINE]",
    // Set the maximum number in this invited party; null leaves a demo limit.
    invitedPartySize: null,
    // Set [] to hide the meal field when meal choices are unnecessary.
    mealOptions: ["[MEAL OPTION 1]", "[MEAL OPTION 2]"],
    // An empty endpoint keeps the form in clearly labeled, unsent demo mode.
    endpoint: "",
    method: "POST"
  },
  guestInfo: [
    { title: "Travel and transport", text: "[TRAVEL INFORMATION]" },
    { title: "Parking", text: "[PARKING INFORMATION]" },
    { title: "Accommodation", text: "[ACCOMMODATION INFORMATION]" },
    { title: "Accessibility", text: "[ACCESSIBILITY INFORMATION]" },
    { title: "Children", text: "[CHILDREN INFORMATION]" },
    { title: "Gifts", text: "[GIFT INFORMATION]" },
    { title: "Questions", text: "[CONTACT NAME AND DETAILS]" }
  ],
  contact: {
    label: "[CONTACT NAME AND DETAILS]",
    // Use mailto:, tel:, or an https: address when contact details are provided.
    href: ""
  },
  closing: { message: "[CLOSING MESSAGE]" },
  meta: {
    title: "[PARTNER ONE NAME] & [PARTNER TWO NAME] — Wedding invitation",
    description: "You are warmly invited to celebrate the wedding of [PARTNER ONE NAME] and [PARTNER TWO NAME] on [WEDDING DATE] in [CITY OR REGION].",
    siteUrl: "https://a-little-forever-invitation.gableddhole4.chatgpt.site",
    previewImage: "assets/social-preview.png"
  }
};
