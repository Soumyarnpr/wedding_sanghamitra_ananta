import { ArrowDown } from "lucide-react";
import { config, initials } from "../config/wedding";
import { Picture } from "../components/media";
import { Flourish } from "../components/ornaments";

export function Welcome({ motion }: { motion: boolean }) {
	const { couple, welcome, artwork, wedding, animation } = config;
	const petalCount = window.matchMedia("(max-width: 650px)").matches
		? animation.mobilePetals
		: animation.petals;
	return (
		<>
			<section
				className="hero dark"
				id="welcome"
				aria-labelledby="cover-title"
			>
				<div className="hero-art">
					<Picture src={artwork.hero} alt="" eager />
				</div>
				<div className="hero-border" aria-hidden="true" />
				{motion && (
					<div className="petal-field" aria-hidden="true">
						{Array.from({ length: petalCount }, (_, index) => (
							<i
								key={index}
								style={{ left: ((index * 137.51) % 100) + "%" }}
							/>
						))}
					</div>
				)}
				<div className="hero-content">
					<div className="ganesha-medallion" data-opening>
						<Picture src={artwork.ganesha} alt="Lord Ganesha" eager />
					</div>
					<p className="invocation" lang="sa" data-opening>
						{welcome.invocation}
					</p>
					<p className="hero-shloka" lang="sa" data-opening>
						{welcome.shloka}
					</p>
					<p className="kicker hero-eyebrow" data-opening>
						<span />
						{welcome.eyebrow}
						<span />
					</p>
					<h1 id="cover-title" data-opening>
						<span>{couple.bride.name}</span>
						<i aria-label="and">&amp;</i>
						<span>{couple.groom.name}</span>
					</h1>
					{/* <p className="hero-nicknames" data-opening>{couple.bride.nickname} <span>·</span> {couple.groom.nickname}</p> */}
					<p className="hero-invitation" data-opening>
						{welcome.message}
					</p>
					<a className="button button-gold" href="#date" data-opening>
						Reveal the date <ArrowDown size={16} />
					</a>
					{/* {wedding.venue.address && (
						<p className="hero-location kicker" data-opening>
							{wedding.venue.address}
						</p>
					)} */}
				</div>
			</section>
			<div className="blessing">
				<div data-enter>
					<p className="odia" lang="or">
						{welcome.odia}
					</p>
					<Flourish />
					<p className="blessing-meaning">{welcome.translation}</p>
				</div>
				<div className="couple-pair">
					{Object.entries(couple).map(([role, person]) => (
						<figure key={role} data-portrait>
							<div className="couple-portrait">
								{person.image ? (
									<Picture
										src={person.image}
										alt={person.alt || person.name}
									/>
								) : (
									<span aria-hidden="true">{person.name[0]}</span>
								)}
							</div>
							<figcaption>
								<strong>{person.nickname || person.name}</strong>
								<small>{person.family}</small>
							</figcaption>
						</figure>
					))}
				</div>
				<span className="blessing-monogram" aria-hidden="true">
					{initials}
				</span>
			</div>
		</>
	);
}
