# encoding: UTF-8

require "json"

module MobiViewExporter

  module ModulesWriter

    extend self

    def write(pieces, folder)

      modules = {}

      pieces.each do |piece|

        id = piece[:module_id]

        next if id.nil?
        next if id.to_s.strip.empty?

        modules[id] ||= {

          id: id,

          pieces: [],

          piece_count: 0,

          materials: []

        }

        modules[id][:pieces] << piece[:mv_uuid]

        modules[id][:piece_count] += 1

        material = piece[:material]

        if material && !modules[id][:materials].include?(material)

          modules[id][:materials] << material

        end

      end

      file = File.join(folder, "modules.json")

      File.open(file, "w:utf-8") do |f|

        f.write(

          JSON.pretty_generate(

            modules.values.sort_by { |m| m[:id].to_s }

          )

        )

      end

      file

    end

  end

end